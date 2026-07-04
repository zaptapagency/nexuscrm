import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { slugify } from "../src/lib/utils";

const prisma = new PrismaClient();

const DEAL_STAGES = [
  "PROSPECTING",
  "QUALIFIED",
  "PROPOSAL",
  "NEGOTIATION",
  "CLOSED_WON",
  "CLOSED_LOST",
] as const;
const LIFECYCLE = ["LEAD", "MQL", "SQL", "OPPORTUNITY", "CUSTOMER"] as const;
const TICKET_STATUS = ["NEW", "OPEN", "WAITING", "RESOLVED", "CLOSED"] as const;
const TICKET_PRIORITY = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
const INDUSTRIES = [
  "Software",
  "Financial Services",
  "Healthcare",
  "Retail",
  "Manufacturing",
  "Education",
  "Marketing",
  "Consulting",
];
const SIZES = ["1-10", "11-50", "51-200", "201-500", "500+"];
const AVATAR_COLORS = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];

function pick<T>(arr: readonly T[], i: number): T {
  return arr[i % arr.length];
}
function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

const COMPANY_NAMES = [
  "Northwind Labs",
  "Acme Robotics",
  "Brightwave Media",
  "Cobalt Financial",
  "Delta Health Group",
  "Evergreen Retail",
  "Fusion Manufacturing",
  "Granite Consulting",
  "Helix Education",
  "Ionix Software",
  "Junction Analytics",
  "Kestrel Logistics",
  "Lumen Security",
  "Meridian Capital",
  "Nimbus Cloud",
  "Orbit Payments",
  "Pinnacle Realty",
  "Quantum Foods",
  "Rivet Industries",
  "Solstice Energy",
  "Terra Biotech",
  "Vertex Studios",
];

const FIRST_NAMES = [
  "Ava", "Liam", "Sofia", "Noah", "Mia", "Ethan", "Isabella", "Lucas", "Amelia", "Mason",
  "Harper", "Logan", "Evelyn", "James", "Charlotte", "Benjamin", "Aria", "Elijah", "Scarlett", "Henry",
  "Grace", "Jack", "Chloe", "Owen", "Layla", "Daniel", "Zoe", "Michael", "Nora", "Sebastian",
  "Hannah", "Jackson", "Lily", "Aiden", "Ella", "Matthew", "Avery", "Samuel", "Sofia", "David",
  "Riley", "Joseph", "Victoria", "Carter", "Penelope", "Wyatt", "Hazel", "Julian", "Aurora", "Levi",
  "Nova", "Isaac", "Emilia", "Gabriel", "Stella",
];
const LAST_NAMES = [
  "Carter", "Reyes", "Nguyen", "Patel", "Kim", "Okafor", "Silva", "Haddad", "Fischer", "Moreau",
  "Rossi", "Novak", "Larsen", "Costa", "Andersson", "Walsh", "Bauer", "Ivanov", "Mensah", "Tanaka",
];

const JOB_TITLES = [
  "VP of Sales", "Marketing Director", "CTO", "Product Manager", "Operations Lead",
  "Head of Growth", "Founder", "Account Executive", "CFO", "Customer Success Manager",
];

async function main() {
  console.log("Resetting data...");
  // Order matters for FK integrity.
  await prisma.formSubmission.deleteMany();
  await prisma.form.deleteMany();
  await prisma.campaignRecipient.deleteMany();
  await prisma.outboxEmail.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.segment.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.note.deleteMany();
  await prisma.task.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.company.deleteMany();
  await prisma.user.deleteMany();

  console.log("Creating users...");
  const passwordHash = await bcrypt.hash("Password123!", 10);
  const adminHash = await bcrypt.hash("Admin123!", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@nexuscrm.test",
      name: "Alex Morgan",
      passwordHash: adminHash,
      role: "ADMIN",
      avatarColor: AVATAR_COLORS[0],
    },
  });
  const manager = await prisma.user.create({
    data: {
      email: "manager@nexuscrm.test",
      name: "Jordan Blake",
      passwordHash,
      role: "MANAGER",
      avatarColor: AVATAR_COLORS[1],
    },
  });
  const rep1 = await prisma.user.create({
    data: {
      email: "rep@nexuscrm.test",
      name: "Taylor Reed",
      passwordHash,
      role: "REP",
      avatarColor: AVATAR_COLORS[2],
    },
  });
  const rep2 = await prisma.user.create({
    data: {
      email: "casey@nexuscrm.test",
      name: "Casey Flores",
      passwordHash,
      role: "REP",
      avatarColor: AVATAR_COLORS[3],
    },
  });
  const users = [admin, manager, rep1, rep2];
  const reps = [manager, rep1, rep2];

  console.log("Creating companies...");
  const companies = [];
  for (let i = 0; i < COMPANY_NAMES.length; i++) {
    const name = COMPANY_NAMES[i];
    const domain = slugify(name).replace(/-/g, "") + ".com";
    const company = await prisma.company.create({
      data: {
        name,
        domain,
        website: `https://${domain}`,
        industry: pick(INDUSTRIES, i),
        size: pick(SIZES, i),
        phone: `+1 (555) ${String(100 + i).padStart(3, "0")}-${String(1000 + i * 7).slice(0, 4)}`,
        city: pick(["San Francisco", "Austin", "New York", "Denver", "Seattle", "Chicago"], i),
        country: "United States",
        ownerId: pick(reps, i).id,
        createdAt: daysAgo(rand(30, 120)),
      },
    });
    companies.push(company);
    await prisma.activity.create({
      data: { type: "CREATED", message: `Company ${name} created`, companyId: company.id, actorId: pick(reps, i).id, createdAt: company.createdAt },
    });
  }

  console.log("Creating contacts...");
  const contacts = [];
  for (let i = 0; i < 56; i++) {
    const firstName = pick(FIRST_NAMES, i);
    const lastName = pick(LAST_NAMES, i * 3 + 1);
    const company = pick(companies, i);
    const domain = company.domain ?? "example.com";
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@${domain}`;
    const created = daysAgo(rand(1, 90));
    const contact = await prisma.contact.create({
      data: {
        firstName,
        lastName,
        email,
        phone: `+1 (555) ${String(200 + i).padStart(3, "0")}-${String(2000 + i * 3).slice(0, 4)}`,
        jobTitle: pick(JOB_TITLES, i),
        lifecycleStage: pick(LIFECYCLE, i),
        companyId: company.id,
        ownerId: pick(reps, i).id,
        source: pick(["Manual", "Import", "Website form", "Campaign"], i),
        createdAt: created,
      },
    });
    contacts.push(contact);
    await prisma.activity.create({
      data: { type: "CREATED", message: `Contact ${firstName} ${lastName} created`, contactId: contact.id, actorId: pick(reps, i).id, createdAt: created },
    });
    if (i % 3 === 0) {
      await prisma.note.create({
        data: {
          body: pick(
            [
              "Had a great intro call — interested in the Growth plan.",
              "Requested a follow-up demo next week.",
              "Budget approved, waiting on procurement.",
              "Currently evaluating two competitors.",
            ],
            i,
          ),
          contactId: contact.id,
          authorId: pick(reps, i).id,
          createdAt: daysAgo(rand(1, 20)),
        },
      });
    }
  }

  console.log("Creating deals...");
  const dealNames = [
    "Annual Platform License", "Enterprise Upgrade", "Onboarding Package", "Q3 Expansion",
    "Marketing Suite Add-on", "Priority Support Plan", "Multi-seat Rollout", "Pilot Program",
  ];
  for (let i = 0; i < 34; i++) {
    const stage = pick(DEAL_STAGES, i);
    const contact = pick(contacts, i * 2);
    const isClosed = stage === "CLOSED_WON" || stage === "CLOSED_LOST";
    const created = daysAgo(rand(10, 80));
    const deal = await prisma.deal.create({
      data: {
        name: `${pick(dealNames, i)} — ${pick(COMPANY_NAMES, i)}`,
        amount: rand(3, 90) * 1000,
        stage,
        closeDate: daysAgo(rand(-30, 40)),
        contactId: contact.id,
        companyId: contact.companyId,
        ownerId: pick(reps, i).id,
        order: i,
        createdAt: created,
        closedAt: isClosed ? daysAgo(rand(1, 40)) : null,
      },
    });
    await prisma.activity.create({
      data: { type: "CREATED", message: `Deal "${deal.name}" created`, dealId: deal.id, contactId: contact.id, actorId: pick(reps, i).id, createdAt: created },
    });
    if (isClosed) {
      await prisma.activity.create({
        data: {
          type: "STAGE_CHANGED",
          message: `Deal moved to ${stage === "CLOSED_WON" ? "Closed Won" : "Closed Lost"}`,
          dealId: deal.id,
          actorId: pick(reps, i).id,
          createdAt: deal.closedAt ?? created,
        },
      });
    }
  }

  console.log("Creating tasks...");
  const taskTitles = [
    "Follow up on proposal", "Send pricing deck", "Schedule discovery call",
    "Prepare contract", "Check in after demo", "Review requirements doc",
  ];
  for (let i = 0; i < 24; i++) {
    const contact = pick(contacts, i * 2 + 1);
    const completed = i % 3 === 0;
    await prisma.task.create({
      data: {
        title: pick(taskTitles, i),
        description: "Auto-generated demo task.",
        dueDate: daysAgo(rand(-10, 15)),
        completed,
        completedAt: completed ? daysAgo(rand(1, 8)) : null,
        priority: pick(["LOW", "MEDIUM", "HIGH"], i),
        assigneeId: pick(reps, i).id,
        contactId: contact.id,
      },
    });
  }

  console.log("Creating tickets...");
  const ticketSubjects = [
    "Cannot log in to dashboard", "Billing discrepancy on invoice", "Feature request: bulk export",
    "Integration webhook failing", "Password reset not working", "Data import stuck",
    "Report numbers look off", "Need help configuring pipeline",
  ];
  for (let i = 0; i < 18; i++) {
    const status = pick(TICKET_STATUS, i);
    const contact = pick(contacts, i * 3);
    const resolved = status === "RESOLVED" || status === "CLOSED";
    const created = daysAgo(rand(1, 30));
    const ticket = await prisma.ticket.create({
      data: {
        subject: pick(ticketSubjects, i),
        description: "Customer reported an issue that needs attention.",
        status,
        priority: pick(TICKET_PRIORITY, i),
        contactId: contact.id,
        assigneeId: pick(reps, i).id,
        order: i,
        createdAt: created,
        resolvedAt: resolved ? daysAgo(rand(0, 5)) : null,
      },
    });
    await prisma.activity.create({
      data: { type: "CREATED", message: `Ticket "${ticket.subject}" opened`, ticketId: ticket.id, contactId: contact.id, actorId: pick(reps, i).id, createdAt: created },
    });
  }

  console.log("Creating segments...");
  const segCustomers = await prisma.segment.create({
    data: {
      name: "Customers",
      description: "All contacts in the Customer lifecycle stage",
      filters: JSON.stringify({ lifecycleStage: "CUSTOMER" }),
      ownerId: admin.id,
    },
  });
  const segLeads = await prisma.segment.create({
    data: {
      name: "New Leads",
      description: "Contacts in the Lead stage",
      filters: JSON.stringify({ lifecycleStage: "LEAD" }),
      ownerId: admin.id,
    },
  });
  await prisma.segment.create({
    data: {
      name: "Qualified (MQL + SQL)",
      description: "Marketing/sales qualified leads",
      filters: JSON.stringify({ lifecycleStage: "MQL" }),
      ownerId: manager.id,
    },
  });

  console.log("Creating campaigns...");
  const campaignDefs = [
    {
      name: "Product Launch Announcement",
      subject: "Introducing NexusCRM 2.0 🚀",
      body: "<p>Hi there,</p><p>We're thrilled to announce our biggest release yet. <a href='https://nexuscrm.test/features'>Explore the new features</a>.</p><p>— The NexusCRM Team</p>",
      segment: segCustomers,
    },
    {
      name: "Welcome Series — New Leads",
      subject: "Welcome to NexusCRM 👋",
      body: "<p>Thanks for your interest! <a href='https://nexuscrm.test/pricing'>See our plans</a> and book a demo.</p>",
      segment: segLeads,
    },
    {
      name: "Q3 Newsletter",
      subject: "What's new this quarter",
      body: "<p>Here's a roundup of everything we shipped. <a href='https://nexuscrm.test/blog'>Read more</a>.</p>",
      segment: segCustomers,
    },
  ];

  for (let ci = 0; ci < campaignDefs.length; ci++) {
    const def = campaignDefs[ci];
    const filters = JSON.parse(def.segment.filters);
    const recipients = await prisma.contact.findMany({
      where: filters.lifecycleStage ? { lifecycleStage: filters.lifecycleStage } : {},
      take: 20,
    });
    const sent = ci < 2; // first two are sent, third is a draft
    const campaign = await prisma.campaign.create({
      data: {
        name: def.name,
        subject: def.subject,
        body: def.body,
        fromName: "NexusCRM Team",
        status: sent ? "SENT" : "DRAFT",
        segmentId: def.segment.id,
        ownerId: admin.id,
        sentAt: sent ? daysAgo(rand(2, 15)) : null,
      },
    });
    if (sent) {
      for (let ri = 0; ri < recipients.length; ri++) {
        const c = recipients[ri];
        const opened = ri % 2 === 0;
        const clicked = ri % 3 === 0;
        const rec = await prisma.campaignRecipient.create({
          data: {
            campaignId: campaign.id,
            contactId: c.id,
            email: c.email,
            opened,
            openedAt: opened ? daysAgo(rand(1, 10)) : null,
            clicked,
            clickedAt: clicked ? daysAgo(rand(1, 10)) : null,
          },
        });
        await prisma.outboxEmail.create({
          data: {
            toEmail: c.email,
            toName: `${c.firstName} ${c.lastName}`,
            fromName: "NexusCRM Team",
            subject: def.subject,
            body: def.body,
            campaignId: campaign.id,
            recipientId: rec.id,
          },
        });
        await prisma.activity.create({
          data: { type: "EMAIL_SENT", message: `Campaign "${def.name}" email sent`, contactId: c.id, createdAt: campaign.sentAt ?? new Date() },
        });
      }
    }
  }

  console.log("Creating forms...");
  const contactForm = await prisma.form.create({
    data: {
      name: "Contact Us",
      description: "General contact form for the website",
      slug: "contact-us",
      submitText: "Send message",
      successMessage: "Thanks for reaching out! A team member will follow up shortly.",
      published: true,
      ownerId: admin.id,
      fields: JSON.stringify([
        { id: "f1", type: "text", label: "First name", placeholder: "Jane", required: true, options: [], mapsTo: "firstName" },
        { id: "f2", type: "text", label: "Last name", placeholder: "Doe", required: true, options: [], mapsTo: "lastName" },
        { id: "f3", type: "email", label: "Work email", placeholder: "jane@company.com", required: true, options: [], mapsTo: "email" },
        { id: "f4", type: "dropdown", label: "Company size", placeholder: "", required: false, options: ["1-10", "11-50", "51-200", "200+"], mapsTo: "none" },
        { id: "f5", type: "textarea", label: "How can we help?", placeholder: "Tell us about your needs", required: false, options: [], mapsTo: "none" },
      ]),
    },
  });
  const demoForm = await prisma.form.create({
    data: {
      name: "Request a Demo",
      description: "Demo request lead capture form",
      slug: "request-a-demo",
      submitText: "Book my demo",
      successMessage: "You're all set! Check your inbox for scheduling details.",
      published: true,
      ownerId: manager.id,
      fields: JSON.stringify([
        { id: "d1", type: "text", label: "Full name", placeholder: "Jane Doe", required: true, options: [], mapsTo: "firstName" },
        { id: "d2", type: "email", label: "Email", placeholder: "jane@company.com", required: true, options: [], mapsTo: "email" },
        { id: "d3", type: "phone", label: "Phone", placeholder: "+1 555 000 0000", required: false, options: [], mapsTo: "phone" },
        { id: "d4", type: "text", label: "Job title", placeholder: "VP of Sales", required: false, options: [], mapsTo: "jobTitle" },
      ]),
    },
  });

  // A couple existing submissions for the contact form.
  for (let i = 0; i < 3; i++) {
    const c = contacts[i];
    await prisma.formSubmission.create({
      data: {
        formId: contactForm.id,
        contactId: c.id,
        data: JSON.stringify({
          "First name": c.firstName,
          "Last name": c.lastName,
          "Work email": c.email,
          "How can we help?": "Interested in a demo of the platform.",
        }),
        createdAt: daysAgo(rand(1, 10)),
      },
    });
  }

  console.log("Seed complete.");
  console.log("  Companies:", await prisma.company.count());
  console.log("  Contacts:", await prisma.contact.count());
  console.log("  Deals:", await prisma.deal.count());
  console.log("  Tasks:", await prisma.task.count());
  console.log("  Tickets:", await prisma.ticket.count());
  console.log("  Campaigns:", await prisma.campaign.count());
  console.log("  Forms:", await prisma.form.count());
  console.log("\nLogins:");
  console.log("  admin@nexuscrm.test / Admin123!  (ADMIN)");
  console.log("  manager@nexuscrm.test / Password123!  (MANAGER)");
  console.log("  rep@nexuscrm.test / Password123!  (REP)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
