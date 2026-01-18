import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ===========================================
// SKILL TAXONOMY DATA (Danielson-Inspired)
// ===========================================

const categories = [
  {
    slug: 'planning-design',
    name: 'Planning & Design',
    description: 'Preparing effective learning experiences before instruction',
    displayOrder: 1,
    icon: 'clipboard-list',
    subskills: [
      {
        slug: 'learning-objectives',
        name: 'Learning Objectives',
        definition: 'Crafting clear, measurable goals aligned to standards',
        behaviors: [
          'Writing objectives in student-friendly language',
          'Backwards-designing from assessments',
          'Sharing objectives visibly with students',
          'Referencing objectives throughout the lesson',
        ],
        antiPatterns: [
          'Vague objectives like "understand X"',
          'Objectives posted but never referenced',
          'Objectives disconnected from actual lesson content',
        ],
        signals: [
          { prompt: 'Wrote/revised learning objectives today', xpValue: 10 },
          { prompt: 'Students could state the learning goal', xpValue: 15 },
          { prompt: 'Referenced objective during lesson', xpValue: 10 },
        ],
      },
      {
        slug: 'differentiation-design',
        name: 'Differentiation Design',
        definition: 'Planning multiple pathways for varied learners',
        behaviors: [
          'Creating tiered tasks',
          'Planning scaffolds for struggling learners',
          'Preparing extension activities',
          'Anticipating diverse student needs',
        ],
        antiPatterns: [
          'One-size-fits-all lessons',
          'Differentiation only for IEP students',
          'Same task at different speeds',
        ],
        signals: [
          { prompt: 'Planned 2+ entry points for a task', xpValue: 15 },
          { prompt: 'Modified a lesson for a specific student', xpValue: 10 },
          { prompt: 'Created a scaffold or support', xpValue: 10 },
        ],
      },
      {
        slug: 'resource-curation',
        name: 'Resource Curation',
        definition: 'Selecting and adapting high-quality materials',
        behaviors: [
          'Evaluating texts for bias and reading level',
          'Adapting publisher materials',
          'Creating original resources when needed',
          'Vetting sources for accuracy',
        ],
        antiPatterns: [
          'Over-reliance on textbook without adaptation',
          'Using first Google result uncritically',
          'Outdated materials',
        ],
        signals: [
          { prompt: 'Found/adapted a quality resource', xpValue: 10 },
          { prompt: 'Vetted material for accuracy or bias', xpValue: 10 },
          { prompt: 'Created an original resource', xpValue: 15 },
        ],
      },
      {
        slug: 'assessment-design',
        name: 'Assessment Design',
        definition: 'Creating checks that reveal true understanding',
        behaviors: [
          'Writing items at varied DOK levels',
          'Planning formative checks throughout lessons',
          'Designing rubrics for open-ended tasks',
          'Aligning assessments to objectives',
        ],
        antiPatterns: [
          'All multiple-choice assessments',
          'Assessing recall only',
          'No rubric for subjective tasks',
        ],
        signals: [
          { prompt: 'Created/revised an assessment', xpValue: 10 },
          { prompt: 'Added a formative check to a lesson', xpValue: 10 },
          { prompt: 'Created or refined a rubric', xpValue: 15 },
        ],
      },
      {
        slug: 'pacing-sequencing',
        name: 'Pacing & Sequencing',
        definition: 'Structuring time and learning progressions thoughtfully',
        behaviors: [
          'Mapping unit arcs with clear progression',
          'Building in buffer time for depth',
          'Sequencing for cognitive load',
          'Connecting lessons to prior learning',
        ],
        antiPatterns: [
          'Rushing to cover content',
          'No flex time in plans',
          'Disconnected, standalone lessons',
        ],
        signals: [
          { prompt: 'Adjusted pacing based on student needs', xpValue: 15 },
          { prompt: 'Mapped or revised a unit sequence', xpValue: 15 },
          { prompt: 'Connected lesson to prior learning', xpValue: 10 },
        ],
      },
    ],
  },
  {
    slug: 'classroom-culture',
    name: 'Classroom Culture',
    description: 'Building an environment where all students can thrive',
    displayOrder: 2,
    icon: 'users',
    subskills: [
      {
        slug: 'norms-routines',
        name: 'Norms & Routines',
        definition: 'Establishing predictable, student-owned systems',
        behaviors: [
          'Teaching routines explicitly',
          'Reinforcing expectations consistently',
          'Involving students in norm-setting',
          'Practicing procedures until automatic',
        ],
        antiPatterns: [
          'Assuming students know expectations',
          'Inconsistent enforcement',
          'Teacher-imposed rules without buy-in',
        ],
        signals: [
          { prompt: 'Reinforced a routine explicitly', xpValue: 10 },
          { prompt: 'Retaught a procedure that needed work', xpValue: 10 },
          { prompt: 'Involved students in norm-setting', xpValue: 15 },
        ],
      },
      {
        slug: 'belonging-identity',
        name: 'Belonging & Identity',
        definition: 'Creating space where all students feel valued',
        behaviors: [
          'Learning and using student names correctly',
          'Incorporating student interests and backgrounds',
          'Affirming diverse identities',
          'Building genuine relationships',
        ],
        antiPatterns: [
          'Mispronouncing names repeatedly',
          'Colorblind or identity-erasing framing',
          'Deficit language about students',
        ],
        signals: [
          { prompt: 'Learned something new about a student', xpValue: 10 },
          { prompt: 'Incorporated student voice or interest', xpValue: 15 },
          { prompt: 'Made a connection with a student', xpValue: 10 },
        ],
      },
      {
        slug: 'emotional-safety',
        name: 'Emotional Safety',
        definition: 'Fostering risk-taking and a mistake-friendly climate',
        behaviors: [
          'Normalizing errors as part of learning',
          'Responding to wrong answers constructively',
          'Managing status and social dynamics',
          'Creating low-stakes practice opportunities',
        ],
        antiPatterns: [
          'Praising only correct answers',
          'Public shaming or embarrassment',
          'Sarcasm that undermines safety',
        ],
        signals: [
          { prompt: 'Celebrated a productive mistake', xpValue: 15 },
          { prompt: 'Addressed a status or safety issue', xpValue: 15 },
          { prompt: 'Created space for risk-taking', xpValue: 10 },
        ],
      },
      {
        slug: 'physical-environment',
        name: 'Physical Environment',
        definition: 'Designing space intentionally for learning',
        behaviors: [
          'Arranging space for collaboration',
          'Ensuring accessibility for all',
          'Managing materials efficiently',
          'Using displays purposefully',
        ],
        antiPatterns: [
          'Fixed rows regardless of activity',
          'Cluttered or chaotic space',
          'Inaccessible materials or seating',
        ],
        signals: [
          { prompt: 'Rearranged space for an activity', xpValue: 10 },
          { prompt: 'Updated displays meaningfully', xpValue: 10 },
          { prompt: 'Improved material organization', xpValue: 10 },
        ],
      },
      {
        slug: 'student-agency',
        name: 'Student Agency',
        definition: 'Giving students meaningful ownership of their learning',
        behaviors: [
          'Offering genuine choice',
          'Involving students in decisions',
          'Supporting student-led routines',
          'Gradually releasing responsibility',
        ],
        antiPatterns: [
          'False or trivial choices',
          'Teacher controls everything',
          'Compliance-focused management',
        ],
        signals: [
          { prompt: 'Offered meaningful choice to students', xpValue: 15 },
          { prompt: 'Student led a routine or activity', xpValue: 15 },
          { prompt: 'Gave students voice in a decision', xpValue: 10 },
        ],
      },
    ],
  },
  {
    slug: 'instructional-delivery',
    name: 'Instructional Delivery',
    description: 'Facilitating learning experiences in the moment',
    displayOrder: 3,
    icon: 'presentation',
    subskills: [
      {
        slug: 'clarity-explanation',
        name: 'Clarity & Explanation',
        definition: 'Communicating content accessibly and precisely',
        behaviors: [
          'Using multiple representations',
          'Checking understanding mid-explanation',
          'Using precise academic language',
          'Breaking down complex ideas',
        ],
        antiPatterns: [
          'Talking too long without checks',
          'Assuming understanding from silence',
          'Jargon without scaffolding',
        ],
        signals: [
          { prompt: 'Used a new representation or example', xpValue: 10 },
          { prompt: 'Paused to check for clarity', xpValue: 10 },
          { prompt: 'Broke down a complex concept', xpValue: 15 },
        ],
      },
      {
        slug: 'questioning',
        name: 'Questioning',
        definition: 'Using questions to deepen student thinking',
        behaviors: [
          'Asking open-ended questions',
          'Increasing wait time',
          'Probing student responses',
          'Following up on student thinking',
        ],
        antiPatterns: [
          'Rapid-fire recall questions',
          'Answering own questions',
          'Only calling on volunteers',
        ],
        signals: [
          { prompt: 'Asked a higher-order question', xpValue: 10 },
          { prompt: 'Extended wait time (3+ seconds)', xpValue: 10 },
          { prompt: 'Probed a student response deeper', xpValue: 15 },
        ],
      },
      {
        slug: 'discussion-facilitation',
        name: 'Discussion Facilitation',
        definition: 'Orchestrating productive student-to-student discourse',
        behaviors: [
          'Using talk moves (revoice, add on, etc.)',
          'Facilitating student-to-student discourse',
          'Holding back teacher voice',
          'Managing participation equitably',
        ],
        antiPatterns: [
          'Teacher ping-pong (T-S-T-S)',
          'One-word answers accepted',
          'Same students dominating',
        ],
        signals: [
          { prompt: 'Students talked directly to each other', xpValue: 15 },
          { prompt: 'Used a talk move effectively', xpValue: 10 },
          { prompt: 'Held back my voice to let students think', xpValue: 10 },
        ],
      },
      {
        slug: 'modeling-demonstration',
        name: 'Modeling & Demonstration',
        definition: 'Making expert thinking and processes visible',
        behaviors: [
          'Doing think-alouds',
          'Using worked examples',
          'Showing process, not just product',
          'Demonstrating strategies explicitly',
        ],
        antiPatterns: [
          'Showing only finished products',
          '"Just do it like this" without explaining',
          'Skipping the struggle part',
        ],
        signals: [
          { prompt: 'Did a think-aloud for students', xpValue: 15 },
          { prompt: 'Modeled a strategy or process', xpValue: 10 },
          { prompt: 'Showed my own thinking process', xpValue: 10 },
        ],
      },
      {
        slug: 'pacing-transitions',
        name: 'Pacing & Transitions',
        definition: 'Managing time and momentum during instruction',
        behaviors: [
          'Executing smooth transitions',
          'Adjusting on the fly based on needs',
          'Maintaining engagement and momentum',
          'Avoiding dead time',
        ],
        antiPatterns: [
          'Long, chaotic transitions',
          'Rushed endings',
          'Rigid adherence to plan despite signals',
        ],
        signals: [
          { prompt: 'Had a smooth, quick transition', xpValue: 10 },
          { prompt: 'Adjusted pacing mid-lesson', xpValue: 15 },
          { prompt: 'Maintained momentum throughout', xpValue: 10 },
        ],
      },
      {
        slug: 'active-engagement',
        name: 'Active Engagement',
        definition: 'Ensuring all students are cognitively active',
        behaviors: [
          'Using total participation techniques',
          'Monitoring engagement actively',
          'Cold-calling equitably',
          'Building in processing time',
        ],
        antiPatterns: [
          'Lecture without interaction',
          'Same 3 students always talking',
          'Passive listening as default',
        ],
        signals: [
          { prompt: 'Used a total participation technique', xpValue: 10 },
          { prompt: 'Had a 100% engagement moment', xpValue: 15 },
          { prompt: 'Cold-called equitably', xpValue: 10 },
        ],
      },
    ],
  },
  {
    slug: 'assessment-feedback',
    name: 'Assessment & Feedback',
    description: 'Using evidence of learning to guide instruction and growth',
    displayOrder: 4,
    icon: 'clipboard-check',
    subskills: [
      {
        slug: 'formative-checking',
        name: 'Formative Checking',
        definition: 'Gathering real-time data on student understanding',
        behaviors: [
          'Using exit tickets effectively',
          'Using whiteboards or response systems',
          'Circulating and observing strategically',
          'Listening to student conversations',
        ],
        antiPatterns: [
          'No checks until the test',
          'Assuming nodding means understanding',
          'Checking only compliant students',
        ],
        signals: [
          { prompt: 'Did a formative check mid-lesson', xpValue: 10 },
          { prompt: 'Knew who was confused before lesson ended', xpValue: 15 },
          { prompt: 'Used student responses to adjust', xpValue: 15 },
        ],
      },
      {
        slug: 'feedback-quality',
        name: 'Feedback Quality',
        definition: 'Providing actionable, timely, growth-oriented feedback',
        behaviors: [
          'Giving specific, actionable praise',
          'Providing growth-oriented corrections',
          'Maintaining reasonable turnaround time',
          'Focusing on process, not just product',
        ],
        antiPatterns: [
          '"Good job" without specificity',
          'Grades without comments',
          'Delayed feedback that loses relevance',
        ],
        signals: [
          { prompt: 'Gave specific, actionable feedback', xpValue: 10 },
          { prompt: 'Returned work within target time', xpValue: 10 },
          { prompt: 'Provided growth-oriented correction', xpValue: 15 },
        ],
      },
      {
        slug: 'data-analysis',
        name: 'Data Analysis',
        definition: 'Making sense of assessment results systematically',
        behaviors: [
          'Looking for patterns across students',
          'Disaggregating by student groups',
          'Identifying specific misconceptions',
          'Tracking progress over time',
        ],
        antiPatterns: [
          'Looking only at averages',
          'No action from data',
          'Data collection without analysis',
        ],
        signals: [
          { prompt: 'Analyzed assessment data', xpValue: 15 },
          { prompt: 'Identified a specific misconception', xpValue: 15 },
          { prompt: 'Looked for patterns in student work', xpValue: 10 },
        ],
      },
      {
        slug: 'responsive-adjustment',
        name: 'Responsive Adjustment',
        definition: 'Acting on assessment information to improve learning',
        behaviors: [
          'Reteaching based on data',
          'Using flexible grouping',
          'Providing targeted intervention',
          'Adjusting upcoming instruction',
        ],
        antiPatterns: [
          'Plowing ahead regardless of data',
          'Data without action',
          'Same intervention for everyone',
        ],
        signals: [
          { prompt: 'Changed plan based on data', xpValue: 15 },
          { prompt: 'Pulled a small group based on need', xpValue: 15 },
          { prompt: 'Retaught based on assessment results', xpValue: 10 },
        ],
      },
      {
        slug: 'student-self-assessment',
        name: 'Student Self-Assessment',
        definition: 'Building student capacity to monitor their own learning',
        behaviors: [
          'Teaching rubric use',
          'Using self-reflection protocols',
          'Supporting student goal-setting',
          'Making criteria visible',
        ],
        antiPatterns: [
          'Teacher-only assessment',
          'Grades as surprises',
          'No student involvement in evaluation',
        ],
        signals: [
          { prompt: 'Students self-assessed their work', xpValue: 15 },
          { prompt: 'A student set a learning goal', xpValue: 15 },
          { prompt: 'Made success criteria visible', xpValue: 10 },
        ],
      },
    ],
  },
  {
    slug: 'student-support',
    name: 'Student Support',
    description: 'Meeting diverse learner needs with targeted support',
    displayOrder: 5,
    icon: 'life-buoy',
    subskills: [
      {
        slug: 'scaffolding',
        name: 'Scaffolding',
        definition: 'Providing temporary supports that enable access',
        behaviors: [
          'Using sentence starters',
          'Providing graphic organizers',
          'Chunking complex tasks',
          'Using gradual release model',
        ],
        antiPatterns: [
          'No supports for complex tasks',
          'Permanent scaffolds never removed',
          'Same scaffold for everyone',
        ],
        signals: [
          { prompt: 'Added a scaffold to enable access', xpValue: 10 },
          { prompt: 'Chunked a complex task', xpValue: 10 },
          { prompt: 'Removed a scaffold as students grew', xpValue: 15 },
        ],
      },
      {
        slug: 'intervention',
        name: 'Intervention',
        definition: 'Targeted support for struggling learners',
        behaviors: [
          'Small group reteaching',
          'Individual conferences',
          'Progress monitoring',
          'Early identification of struggles',
        ],
        antiPatterns: [
          'Waiting for failure',
          'Only during designated time',
          'Same intervention regardless of need',
        ],
        signals: [
          { prompt: 'Worked with a struggling student', xpValue: 10 },
          { prompt: 'Did a reteach moment', xpValue: 10 },
          { prompt: 'Caught a struggle early', xpValue: 15 },
        ],
      },
      {
        slug: 'extension',
        name: 'Extension',
        definition: 'Challenging learners who are ready for more',
        behaviors: [
          'Providing enrichment tasks',
          'Asking deeper questions',
          'Offering leadership roles',
          'Connecting to advanced content',
        ],
        antiPatterns: [
          'Same work faster',
          'Ignoring advanced learners',
          'Busy work instead of depth',
        ],
        signals: [
          { prompt: 'Extended for a ready-for-more student', xpValue: 15 },
          { prompt: 'Added depth or complexity', xpValue: 10 },
          { prompt: 'Gave leadership opportunity', xpValue: 10 },
        ],
      },
      {
        slug: 'accommodation-modification',
        name: 'Accommodation & Modification',
        definition: 'Meeting IEP/504 and individual needs consistently',
        behaviors: [
          'Implementing required supports',
          'Making proactive adjustments',
          'Knowing student plans',
          'Tracking accommodation effectiveness',
        ],
        antiPatterns: [
          'Ignoring IEPs',
          'Reactive only',
          'One-time accommodations',
        ],
        signals: [
          { prompt: 'Implemented an accommodation', xpValue: 10 },
          { prompt: 'Checked IEP/504 proactively', xpValue: 10 },
          { prompt: 'Adjusted based on student need', xpValue: 10 },
        ],
      },
    ],
  },
  {
    slug: 'content-knowledge',
    name: 'Content Knowledge',
    description: 'Deepening expertise in your subject area',
    displayOrder: 6,
    icon: 'book-open',
    subskills: [
      {
        slug: 'subject-expertise',
        name: 'Subject Expertise',
        definition: 'Deep knowledge of the content you teach',
        behaviors: [
          'Providing accurate explanations',
          'Connecting to broader discipline',
          'Anticipating student misconceptions',
          'Going beyond the textbook',
        ],
        antiPatterns: [
          'Surface-level understanding',
          'Reading just ahead of students',
          'Unable to answer student questions',
        ],
        signals: [
          { prompt: 'Deepened my content knowledge', xpValue: 15 },
          { prompt: 'Answered a tough student question', xpValue: 10 },
          { prompt: 'Connected to broader discipline', xpValue: 10 },
        ],
      },
      {
        slug: 'curricular-connections',
        name: 'Curricular Connections',
        definition: 'Linking within and across subjects meaningfully',
        behaviors: [
          'Vertical alignment across grades',
          'Cross-curricular connections',
          'Real-world applications',
          'Connecting to student experiences',
        ],
        antiPatterns: [
          'Isolated units',
          'Content as ends in themselves',
          'No connection to students\' lives',
        ],
        signals: [
          { prompt: 'Made a cross-curricular connection', xpValue: 10 },
          { prompt: 'Connected to real world', xpValue: 10 },
          { prompt: 'Built on prior grade content', xpValue: 10 },
        ],
      },
      {
        slug: 'pedagogical-content-knowledge',
        name: 'Pedagogical Content Knowledge',
        definition: 'Knowing how to teach your specific content effectively',
        behaviors: [
          'Using content-specific strategies',
          'Anticipating where students struggle',
          'Having multiple explanations ready',
          'Knowing common misconceptions',
        ],
        antiPatterns: [
          'Generic teaching moves only',
          'Same approach for all content',
          'Surprised by student struggles',
        ],
        signals: [
          { prompt: 'Used a content-specific strategy', xpValue: 15 },
          { prompt: 'Anticipated a sticking point', xpValue: 15 },
          { prompt: 'Had an alternate explanation ready', xpValue: 10 },
        ],
      },
      {
        slug: 'staying-current',
        name: 'Staying Current',
        definition: 'Ongoing learning in your field',
        behaviors: [
          'Professional reading',
          'Content-focused PD',
          'Disciplinary engagement',
          'Following field developments',
        ],
        antiPatterns: [
          'Static knowledge',
          'Ignoring field developments',
          'Same materials year after year',
        ],
        signals: [
          { prompt: 'Read/watched something in my field', xpValue: 10 },
          { prompt: 'Attended content-focused PD', xpValue: 15 },
          { prompt: 'Updated my knowledge', xpValue: 10 },
        ],
      },
    ],
  },
  {
    slug: 'professional-practice',
    name: 'Professional Practice',
    description: 'Growing as a professional educator',
    displayOrder: 7,
    icon: 'briefcase',
    subskills: [
      {
        slug: 'reflection',
        name: 'Reflection',
        definition: 'Systematic thinking about your practice',
        behaviors: [
          'Journaling about teaching',
          'Analyzing lessons after delivery',
          'Identifying growth areas',
          'Asking "what if" questions',
        ],
        antiPatterns: [
          'No reflection time',
          'Same lesson year after year',
          'Blaming students for failures',
        ],
        signals: [
          { prompt: 'Reflected on a lesson', xpValue: 10 },
          { prompt: 'Identified what to change next time', xpValue: 10 },
          { prompt: 'Asked myself a hard question', xpValue: 15 },
        ],
      },
      {
        slug: 'collaboration',
        name: 'Collaboration',
        definition: 'Working productively with colleagues',
        behaviors: [
          'Co-planning effectively',
          'Sharing resources generously',
          'Observing peers',
          'Giving and receiving feedback',
        ],
        antiPatterns: [
          'Professional isolation',
          'Hoarding materials',
          'Defensive about feedback',
        ],
        signals: [
          { prompt: 'Collaborated with a colleague', xpValue: 10 },
          { prompt: 'Shared a resource', xpValue: 10 },
          { prompt: 'Observed or was observed by a peer', xpValue: 15 },
        ],
      },
      {
        slug: 'family-communication',
        name: 'Family Communication',
        definition: 'Engaging families as partners',
        behaviors: [
          'Proactive positive updates',
          'Responsive communication',
          'Clear, jargon-free messages',
          'Multiple contact methods',
        ],
        antiPatterns: [
          'Only negative contacts',
          'No communication until problems',
          'Jargon families don\'t understand',
        ],
        signals: [
          { prompt: 'Contacted a family proactively', xpValue: 10 },
          { prompt: 'Sent positive news home', xpValue: 10 },
          { prompt: 'Responded to family communication', xpValue: 10 },
        ],
      },
      {
        slug: 'organization-systems',
        name: 'Organization & Systems',
        definition: 'Managing the administrative load effectively',
        behaviors: [
          'Efficient grading practices',
          'Organized records',
          'Meeting deadlines',
          'Sustainable workload management',
        ],
        antiPatterns: [
          'Chronic grading backlog',
          'Lost materials',
          'Missed deadlines',
        ],
        signals: [
          { prompt: 'On top of grading', xpValue: 10 },
          { prompt: 'Met an important deadline', xpValue: 10 },
          { prompt: 'Improved an organizational system', xpValue: 15 },
        ],
      },
      {
        slug: 'growth-orientation',
        name: 'Growth Orientation',
        definition: 'Actively pursuing improvement',
        behaviors: [
          'Seeking feedback proactively',
          'Trying new approaches',
          'Setting goals',
          'Embracing challenge',
        ],
        antiPatterns: [
          'Fixed mindset',
          'Defensive about practice',
          'Avoiding challenge',
        ],
        signals: [
          { prompt: 'Tried something new', xpValue: 15 },
          { prompt: 'Asked for feedback', xpValue: 15 },
          { prompt: 'Set a professional goal', xpValue: 10 },
        ],
      },
    ],
  },
  {
    slug: 'equity-inclusion',
    name: 'Equity & Inclusion',
    description: 'Ensuring all students have what they need to succeed',
    displayOrder: 8,
    icon: 'heart-handshake',
    subskills: [
      {
        slug: 'culturally-responsive',
        name: 'Culturally Responsive Practice',
        definition: 'Centering diverse perspectives and building on student assets',
        behaviors: [
          'Using diverse texts and examples',
          'Connecting to student cultures',
          'Asset framing for all students',
          'Learning about student backgrounds',
        ],
        antiPatterns: [
          'Single narrative curriculum',
          'Deficit framing',
          'Tourist approach to culture',
        ],
        signals: [
          { prompt: 'Used diverse materials', xpValue: 10 },
          { prompt: 'Connected to student background', xpValue: 15 },
          { prompt: 'Used asset-based language', xpValue: 10 },
        ],
      },
      {
        slug: 'bias-interruption',
        name: 'Bias Interruption',
        definition: 'Noticing and disrupting inequitable patterns',
        behaviors: [
          'Monitoring calling patterns',
          'Examining grade distributions',
          'Questioning assumptions',
          'Interrupting bias in real-time',
        ],
        antiPatterns: [
          'Ignoring disparities',
          '"I don\'t see color" mindset',
          'Unexamined assumptions',
        ],
        signals: [
          { prompt: 'Checked my patterns for equity', xpValue: 15 },
          { prompt: 'Interrupted a bias moment', xpValue: 15 },
          { prompt: 'Questioned an assumption', xpValue: 10 },
        ],
      },
      {
        slug: 'access-opportunity',
        name: 'Access & Opportunity',
        definition: 'Ensuring equitable participation for all',
        behaviors: [
          'Equitable group roles',
          'Technology access for all',
          'Materials access for all',
          'Opportunity gap monitoring',
        ],
        antiPatterns: [
          'Same students always leading',
          'Assuming equal access',
          'Ignoring opportunity gaps',
        ],
        signals: [
          { prompt: 'Ensured access for all students', xpValue: 10 },
          { prompt: 'Rotated leadership equitably', xpValue: 10 },
          { prompt: 'Addressed an opportunity gap', xpValue: 15 },
        ],
      },
      {
        slug: 'critical-consciousness',
        name: 'Critical Consciousness',
        definition: 'Engaging students in examining systems and power',
        behaviors: [
          'Age-appropriate fairness discussions',
          'Analyzing power and systems',
          'Student voice on equity issues',
          'Connecting content to justice',
        ],
        antiPatterns: [
          'Avoiding hard topics',
          'False neutrality',
          'Shutting down questions about fairness',
        ],
        signals: [
          { prompt: 'Discussed fairness or justice', xpValue: 15 },
          { prompt: 'Students examined a system', xpValue: 15 },
          { prompt: 'Connected content to real-world issues', xpValue: 10 },
        ],
      },
    ],
  },
]

// Quests data
const quests = [
  // Daily quests
  {
    slug: 'try-engagement-technique',
    title: 'Try a new engagement technique',
    description: 'Log any Active Engagement signal today',
    questType: 'DAILY',
    criteria: { type: 'signal_in_subskill', subskillSlug: 'active-engagement', count: 1 },
    xpReward: 25,
  },
  {
    slug: 'specific-feedback',
    title: 'Give specific feedback',
    description: 'Log a Feedback Quality signal',
    questType: 'DAILY',
    criteria: { type: 'signal_in_subskill', subskillSlug: 'feedback-quality', count: 1 },
    xpReward: 25,
  },
  {
    slug: 'learn-about-student',
    title: 'Learn something about a student',
    description: 'Log a Belonging & Identity signal',
    questType: 'DAILY',
    criteria: { type: 'signal_in_subskill', subskillSlug: 'belonging-identity', count: 1 },
    xpReward: 25,
  },
  {
    slug: 'formative-check',
    title: 'Do a formative check',
    description: 'Log a Formative Checking signal',
    questType: 'DAILY',
    criteria: { type: 'signal_in_subskill', subskillSlug: 'formative-checking', count: 1 },
    xpReward: 25,
  },
  {
    slug: 'ask-better-question',
    title: 'Ask a better question',
    description: 'Log a Questioning signal',
    questType: 'DAILY',
    criteria: { type: 'signal_in_subskill', subskillSlug: 'questioning', count: 1 },
    xpReward: 25,
  },
  // Weekly quests
  {
    slug: 'breadth-explorer',
    title: 'Breadth Explorer',
    description: 'Log signals in 4+ different categories this week',
    questType: 'WEEKLY',
    criteria: { type: 'categories_touched', count: 4 },
    xpReward: 50,
  },
  {
    slug: 'streak-builder',
    title: 'Streak Builder',
    description: 'Reach a 5-day logging streak',
    questType: 'WEEKLY',
    criteria: { type: 'streak', days: 5 },
    xpReward: 50,
  },
  {
    slug: 'add-artifact',
    title: 'Add Evidence',
    description: 'Attach an artifact to any signal this week',
    questType: 'WEEKLY',
    criteria: { type: 'artifact_added', count: 1 },
    xpReward: 50,
  },
  {
    slug: 'weekly-reflection',
    title: 'Weekly Reflection',
    description: 'Complete your weekly reflection',
    questType: 'WEEKLY',
    criteria: { type: 'reflection', reflectionType: 'WEEKLY' },
    xpReward: 50,
  },
]

// Badges data
const badges = [
  {
    slug: 'first-steps',
    name: 'First Steps',
    description: 'Complete onboarding and log your first 3 signals',
    icon: 'footprints',
    criteria: { type: 'signals_logged', count: 3 },
  },
  {
    slug: 'habit-formed',
    name: 'Habit Formed',
    description: 'Reach a 14-day logging streak',
    icon: 'flame',
    criteria: { type: 'streak', days: 14 },
  },
  {
    slug: 'curious-mind',
    name: 'Curious Mind',
    description: 'Log signals in all 8 categories',
    icon: 'brain',
    criteria: { type: 'all_categories_touched' },
  },
  {
    slug: 'deep-diver',
    name: 'Deep Diver',
    description: 'Reach Level 3 in any subskill',
    icon: 'target',
    criteria: { type: 'subskill_level', level: 3 },
  },
  {
    slug: 'reflective-practitioner',
    name: 'Reflective Practitioner',
    description: 'Complete 4 weekly reflections',
    icon: 'message-circle',
    criteria: { type: 'reflections_completed', count: 4 },
  },
  {
    slug: 'mentor-ready',
    name: 'Mentor Ready',
    description: 'Reach Level 5 in any subskill',
    icon: 'award',
    criteria: { type: 'subskill_level', level: 5 },
  },
  {
    slug: 'growth-mindset',
    name: 'Growth Mindset',
    description: 'Return after a 14+ day pause',
    icon: 'refresh-cw',
    criteria: { type: 'returned_after_pause', days: 14 },
  },
]

async function main() {
  console.log('Seeding database...')

  // Clear existing data (in reverse order of dependencies)
  await prisma.userBadge.deleteMany()
  await prisma.badge.deleteMany()
  await prisma.questCompletion.deleteMany()
  await prisma.quest.deleteMany()
  await prisma.reflection.deleteMany()
  await prisma.userSubskillProgress.deleteMany()
  await prisma.xpLedger.deleteMany()
  await prisma.artifact.deleteMany()
  await prisma.signal.deleteMany()
  await prisma.signalTemplate.deleteMany()
  await prisma.subskill.deleteMany()
  await prisma.category.deleteMany()

  // Seed categories and subskills
  for (const categoryData of categories) {
    const { subskills, ...categoryFields } = categoryData

    const category = await prisma.category.create({
      data: categoryFields,
    })

    console.log(`Created category: ${category.name}`)

    for (let i = 0; i < subskills.length; i++) {
      const { signals, ...subskillFields } = subskills[i]

      const subskill = await prisma.subskill.create({
        data: {
          ...subskillFields,
          categoryId: category.id,
          displayOrder: i + 1,
        },
      })

      console.log(`  Created subskill: ${subskill.name}`)

      // Create signal templates
      for (const signal of signals) {
        await prisma.signalTemplate.create({
          data: {
            subskillId: subskill.id,
            prompt: signal.prompt,
            xpValue: signal.xpValue,
          },
        })
      }
    }
  }

  // Seed quests
  for (const quest of quests) {
    await prisma.quest.create({
      data: {
        slug: quest.slug,
        title: quest.title,
        description: quest.description,
        questType: quest.questType as 'DAILY' | 'WEEKLY' | 'BOSS',
        criteria: quest.criteria,
        xpReward: quest.xpReward,
      },
    })
    console.log(`Created quest: ${quest.title}`)
  }

  // Seed badges
  for (const badge of badges) {
    await prisma.badge.create({
      data: badge,
    })
    console.log(`Created badge: ${badge.name}`)
  }

  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
