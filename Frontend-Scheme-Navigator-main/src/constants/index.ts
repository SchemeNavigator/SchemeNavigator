import { SchemeCategory, EmploymentType, IncomeRange } from '../types';

export const INDIAN_STATES = [
  'All India',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Delhi (NCT)',
  'Jammu & Kashmir',
  'Ladakh',
  'Chandigarh',
  'Puducherry',
];

export const POPULAR_DISTRICTS: Record<string, string[]> = {
  'Haryana': ['Gurugram', 'Faridabad', 'Hisar', 'Karnal', 'Ambala', 'Rohtak', 'Sonipat', 'Panipat', 'Kurukshetra', 'Others'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Thane', 'Aurangabad', 'Solapur', 'Kolhapur', 'Others'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Varanasi', 'Noida', 'Prayagraj', 'Agra', 'Meerut', 'Gorakhpur', 'Others'],
  'Delhi (NCT)': ['New Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi', 'Central Delhi'],
  'Karnataka': ['Bengaluru Urban', 'Mysuru', 'Mangaluru', 'Hubballi-Dharwad', 'Belagavi', 'Others'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Others'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Bikaner', 'Ajmer', 'Others'],
  'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Darbhanga', 'Others'],
  'Madhya Pradesh': ['Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain', 'Others'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Others'],
  'West Bengal': ['Kolkata', 'Howrah', 'North 24 Parganas', 'South 24 Parganas', 'Darjeeling', 'Others'],
};

export const SCHEME_CATEGORIES: SchemeCategory[] = [
  'Education',
  'Agriculture',
  'Employment',
  'Business',
  'Women & Child',
  'Housing',
  'Healthcare',
  'Social Security',
  'Financial Assistance',
  'Skill Development',
];

export const CATEGORIES_WITH_META: { id: SchemeCategory; icon: string; count: number; desc: string }[] = [
  { id: 'Social Security', icon: 'Users', count: 1249, desc: 'Old-age pensions, widow pensions, disability stipends & social welfare' },
  { id: 'Education', icon: 'GraduationCap', count: 816, desc: 'Scholarships, fee waivers, educational loans & research grants' },
  { id: 'Agriculture', icon: 'Sprout', count: 614, desc: 'Income support, crop insurance, solar pumps & farm subsidies' },
  { id: 'Business', icon: 'Briefcase', count: 500, desc: 'Collateral-free loans, MSME subsidies & startup capital' },
  { id: 'Healthcare', icon: 'ShieldPlus', count: 156, desc: 'Cashless treatment cover, health insurance & wellness centers' },
  { id: 'Financial Assistance', icon: 'Coins', count: 100, desc: 'Direct benefit transfers, interest relief & economic aid' },
  { id: 'Skill Development', icon: 'Lightbulb', count: 100, desc: 'Free vocational certifications, industry skilling & toolkits' },
  { id: 'Employment', icon: 'UserCheck', count: 96, desc: 'Apprenticeships, placement linked programs & livelihood missions' },
  { id: 'Women & Child', icon: 'HeartHandshake', count: 73, desc: 'Maternity assistance, girl child savings & self-help support' },
  { id: 'Housing', icon: 'Home', count: 64, desc: 'Pucca house subsidies, interest subvention & urban housing' },
];

export const DEFAULT_CATEGORY_COUNTS: Record<string, number> = {
  'Social Security': 1249,
  'Education': 816,
  'Agriculture': 614,
  'Business': 500,
  'Healthcare': 156,
  'Financial Assistance': 100,
  'Skill Development': 100,
  'Employment': 96,
  'Women & Child': 73,
  'Housing': 64,
  'Sports & Culture': 52,
  'Travel & Tourism': 19,
};

export const EMPLOYMENT_TYPES: EmploymentType[] = [
  'Student',
  'Farmer',
  'Business owner',
  'Employed',
  'Unemployed',
  'Self-employed',
  'Homemaker',
  'Retired',
  'Other',
];

export const INCOME_RANGES: IncomeRange[] = [
  'Below ₹1 lakh',
  '₹1–2.5 lakh',
  '₹2.5–5 lakh',
  '₹5–10 lakh',
  '₹10 lakh+',
  'Prefer not to say',
];

export const AUDIENCE_PERSONAS = [
  {
    id: 'students',
    label: 'Students',
    icon: 'GraduationCap',
    headline: 'Education Grants & Skill Development',
    description: 'Find merit scholarships, post-matric fee waivers, coaching subsidies, and laptop/device distribution programs.',
    keySchemes: ['PM Uchchatar Shiksha Protsahan', 'NSP Central Sector Scheme', 'National Means-cum-Merit'],
    sampleProfile: { age: 20, state: 'Haryana', employmentType: 'Student', incomeRange: '₹1–2.5 lakh' }
  },
  {
    id: 'farmers',
    label: 'Farmers',
    icon: 'Sprout',
    headline: 'Agricultural & Income Support',
    description: 'Discover direct income support, PM-KUSUM solar pumps, PM Fasal Bima crop insurance, and Kisan Credit Cards.',
    keySchemes: ['PM-KISAN Samman Nidhi', 'PM Fasal Bima Yojana', 'PM-KUSUM Solar Pump Scheme'],
    sampleProfile: { age: 42, state: 'Maharashtra', employmentType: 'Farmer', incomeRange: '₹1–2.5 lakh' }
  },
  {
    id: 'entrepreneurs',
    label: 'Entrepreneurs',
    icon: 'Rocket',
    headline: 'MSME & Startup Financial Backing',
    description: 'Access collateral-free loans up to ₹10 Lakh, Stand-Up India funding, and PMEGP capital subsidies up to 35%.',
    keySchemes: ['PM Mudra Yojana (PMMY)', 'Prime Minister Employment Generation (PMEGP)', 'Stand-Up India Scheme'],
    sampleProfile: { age: 29, state: 'Karnataka', employmentType: 'Business owner', incomeRange: '₹2.5–5 lakh' }
  },
  {
    id: 'women',
    label: 'Women',
    icon: 'Heart',
    headline: 'Women Empowerment & Financial Independence',
    description: 'Explore high-interest savings for girl children, maternity assistance, SHG loans, and women-led enterprise grants.',
    keySchemes: ['Sukanya Samriddhi Yojana', 'PM Matru Vandana Yojana', 'Mahila Samman Savings Certificate'],
    sampleProfile: { age: 28, gender: 'female', state: 'Uttar Pradesh', incomeRange: 'Below ₹1 lakh' }
  },
  {
    id: 'jobseekers',
    label: 'Job Seekers',
    icon: 'Briefcase',
    headline: 'Vocational Training & Employment',
    description: 'Find free certified vocational skilling, national apprenticeship stipends, and placement-linked livelihood training.',
    keySchemes: ['PM Kaushal Vikas Yojana 4.0', 'National Apprenticeship Promotion Scheme', 'Deen Dayal Upadhyaya GKY'],
    sampleProfile: { age: 23, employmentType: 'Unemployed', state: 'Rajasthan', incomeRange: 'Below ₹1 lakh' }
  },
  {
    id: 'families',
    label: 'Families',
    icon: 'Home',
    headline: 'Welfare, Housing & Healthcare',
    description: 'Get ₹5 Lakh annual cashless healthcare for the family, pucca house construction subsidies, and subsidized food security.',
    keySchemes: ['Ayushman Bharat PM-JAY', 'PM Awas Yojana (Gramin & Urban)', 'PM Ujjwala Yojana'],
    sampleProfile: { age: 36, hasBPLCard: true, state: 'Madhya Pradesh', incomeRange: 'Below ₹1 lakh' }
  },
  {
    id: 'seniors',
    label: 'Senior Citizens',
    icon: 'Shield',
    headline: 'Pensions & Social Security',
    description: 'Secure guaranteed monthly pensions, subsidized medical checkups, and old-age social security stipends.',
    keySchemes: ['Indira Gandhi National Old Age Pension', 'Atal Pension Yojana', 'PM Vaya Vandana Yojana'],
    sampleProfile: { age: 64, employmentType: 'Retired', state: 'Delhi (NCT)', incomeRange: '₹1–2.5 lakh' }
  },
];

export const STATS_DATA = [
  { value: '3000+', label: 'Schemes Indexed', note: 'Central & State databases' },
  { value: '50+', label: 'Government Depts', note: 'Ministries & Directorates' },
  { value: '24/7', label: 'Guidance Engine', note: 'Transparent & explainable' },
];


export const TRUST_PILLARS = [
  {
    icon: 'CheckCircle2',
    title: 'Verified Information',
    description: 'Every scheme lists the managing ministry, official application URL, and last verified timestamp.',
  },
  {
    icon: 'Lock',
    title: 'Secure & Private',
    description: 'Your profile data is stored locally in your browser. We never sell or share your personal details.',
  },
  {
    icon: 'Clock',
    title: 'Save Time & Effort',
    description: 'No more searching through dozens of disconnected gazettes and portals. One unified compass.',
  },
  {
    icon: 'Compass',
    title: 'Explainable Guidance',
    description: 'We don’t just show matching schemes — we explain exactly which criteria you satisfy.',
  },
];

export const HOW_IT_WORKS_STEPS = [
  {
    step: '01',
    title: 'Tell Us About You',
    description: 'Answer a few simple questions regarding your location, occupation, and basic background without any paperwork.',
    highlight: 'No scheme knowledge needed',
    icon: 'UserCheck',
  },
  {
    step: '02',
    title: 'Discover Relevant Schemes',
    description: 'Our rule-based matching engine filters thousands of eligibility conditions to find schemes that fit your exact profile.',
    highlight: 'Instant multi-criteria matching',
    icon: 'Cpu',
  },
  {
    step: '03',
    title: 'Understand Your Options',
    description: 'Read plain-English summaries, exact benefit values, required document checklists, and match reasoning.',
    highlight: 'Plain language, no jargon',
    icon: 'FileText',
  },
  {
    step: '04',
    title: 'Apply With Confidence',
    description: 'Follow our step-by-step checklist and proceed safely to the verified official government portal (.gov.in / .nic.in).',
    highlight: 'Safe exit to official portal',
    icon: 'ExternalLink',
  },
];

export const FAQ_LIST = [
  {
    q: 'Is SchemeNavigator an official government website?',
    a: 'No. SchemeNavigator is an independent, citizen-first discovery and guidance platform. We act as a navigational compass to help citizens find and understand schemes, but all final applications, verifications, and approvals occur on official government portals (e.g., myscheme.gov.in, nsp.gov.in, pmkisan.gov.in).',
  },
  {
    q: 'Does SchemeNavigator charge any fees for recommendations?',
    a: 'Never. SchemeNavigator is completely free for all citizens. Government schemes never require fees for discovery, and you should beware of fraudulent agents.',
  },
  {
    q: 'How does the Match Score work?',
    a: 'Our matching algorithm evaluates your profile (age, income range, state, occupation, category) against official eligibility parameters and assigns a compatibility percentage. It is an informational indicator, not a government approval.',
  },
  {
    q: 'Is my personal profile information safe?',
    a: 'Yes. We follow strict data minimization principles. Your profile inputs are processed locally in your browser to generate matching results. We do not ask for sensitive personal identification cards like full Aadhaar numbers, pancard, income and caste certificates, etc.',
  },

  {
    q: 'What if I find a scheme that has recently updated guidelines?',
    a: 'We list the last verified date and provide direct links to the official ministry portal where the latest gazettes and operational guidelines are maintained.',
  },
];

export const SAMPLE_AI_PROMPTS = [
  'I am a 20-year-old college student from Haryana with a family income of ₹1.5 Lakh. What scholarships apply to me?',
  'I am a small farmer in Maharashtra with 2 acres of land. What income and equipment subsidies are available?',
  'I am a woman looking to start a small food processing business. Are there collateral-free loans or grants?',
  'What welfare schemes provide free healthcare cover up to ₹5 Lakh for low-income families?',
  'Are there government schemes offering free vocational training with stipend for 12th pass students?',
];
