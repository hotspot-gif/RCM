import { create } from 'zustand'

export interface Retailer {
  id: string
  company_name: string
  vat_number: string
  address_lane: string
  house_number: string
  city: string
  postcode: string
  contact_person_name: string
  contact_person_surname: string
  mobile_number: string
  landline_number: string
  email: string
  branch: string
  zone: string
  created_by: string
  created_by_name: string
  created_at: string
}

export interface Contract {
  id: string
  retailer_id: string
  retailer_name: string
  contract_number: string
  status: 'PENDING' | 'SIGNED' | 'SENT'
  retailer_signature: string | null
  staff_signature: string | null
  contract_date: string
  created_by: string
  created_by_name: string
  branch: string
  zone: string
  pdf_url: string | null
  retailer_email: string
  staff_email: string
  created_at: string
  retailer?: Retailer
}

export interface AppUser {
  id: string
  email: string
  full_name: string
  role: 'ADMIN' | 'ASM' | 'FSE'
  branch: string | null
  zone: string | null
  created_at: string
  is_active: boolean
}

interface DataState {
  retailers: Retailer[]
  contracts: Contract[]
  users: AppUser[]
  addRetailer: (retailer: Retailer) => void
  updateRetailer: (id: string, data: Partial<Retailer>) => void
  deleteRetailer: (id: string) => void
  addContract: (contract: Contract) => void
  updateContract: (id: string, data: Partial<Contract>) => void
  deleteContract: (id: string) => void
  addUser: (user: AppUser) => void
  updateUser: (id: string, data: Partial<AppUser>) => void
  deleteUser: (id: string) => void
  initializeDemoData: () => void
}

function generateDemoData() {
  const users: AppUser[] = [
    {
      id: 'admin-1',
      email: 'admin@lmit.com',
      full_name: 'Marco Rossi',
      role: 'ADMIN',
      branch: null,
      zone: null,
      created_at: '2024-01-01T00:00:00Z',
      is_active: true,
    },
    {
      id: 'asm-1',
      email: 'asm.milan@lmit.com',
      full_name: 'Giulia Bianchi',
      role: 'ASM',
      branch: 'LMIT-HS-MILAN',
      zone: null,
      created_at: '2024-01-05T00:00:00Z',
      is_active: true,
    },
    {
      id: 'asm-2',
      email: 'asm.rome@lmit.com',
      full_name: 'Luca Ferraro',
      role: 'ASM',
      branch: 'LMIT-HS-ROME',
      zone: null,
      created_at: '2024-01-06T00:00:00Z',
      is_active: true,
    },
    {
      id: 'fse-1',
      email: 'fse.milan1@lmit.com',
      full_name: 'Sofia Conti',
      role: 'FSE',
      branch: 'LMIT-HS-MILAN',
      zone: 'HS MILANO ZONE 1',
      created_at: '2024-01-10T00:00:00Z',
      is_active: true,
    },
    {
      id: 'fse-2',
      email: 'fse.milan2@lmit.com',
      full_name: 'Alessandro Ricci',
      role: 'FSE',
      branch: 'LMIT-HS-MILAN',
      zone: 'HS MILANO ZONE 2',
      created_at: '2024-01-11T00:00:00Z',
      is_active: true,
    },
    {
      id: 'fse-3',
      email: 'fse.rome1@lmit.com',
      full_name: 'Valentina Leone',
      role: 'FSE',
      branch: 'LMIT-HS-ROME',
      zone: 'HS ROMA ZONE 1',
      created_at: '2024-01-12T00:00:00Z',
      is_active: true,
    },
  ]

  const retailers: Retailer[] = [
    {
      id: 'ret-1',
      company_name: 'Elettronica Milano SRL',
      vat_number: 'IT12345678901',
      address_lane: 'Via Torino',
      house_number: '45',
      city: 'Milano',
      postcode: '20123',
      contact_person_name: 'Roberto',
      contact_person_surname: 'Mancini',
      mobile_number: '+39 345 678 9012',
      landline_number: '+39 02 1234567',
      email: 'roberto@elettronica-milano.it',
      branch: 'LMIT-HS-MILAN',
      zone: 'HS MILANO ZONE 1',
      created_by: 'fse-1',
      created_by_name: 'Sofia Conti',
      created_at: '2024-02-01T10:00:00Z',
    },
    {
      id: 'ret-2',
      company_name: 'Tech Roma SPA',
      vat_number: 'IT98765432109',
      address_lane: 'Via del Corso',
      house_number: '120',
      city: 'Roma',
      postcode: '00186',
      contact_person_name: 'Francesca',
      contact_person_surname: 'Moretti',
      mobile_number: '+39 348 123 4567',
      landline_number: '+39 06 9876543',
      email: 'francesca@techroma.it',
      branch: 'LMIT-HS-ROME',
      zone: 'HS ROMA ZONE 1',
      created_by: 'fse-3',
      created_by_name: 'Valentina Leone',
      created_at: '2024-02-03T11:00:00Z',
    },
    {
      id: 'ret-3',
      company_name: 'Digital Store Napoli',
      vat_number: 'IT55566677788',
      address_lane: 'Via Toledo',
      house_number: '234',
      city: 'Napoli',
      postcode: '80134',
      contact_person_name: 'Antonio',
      contact_person_surname: 'Esposito',
      mobile_number: '+39 333 999 8877',
      landline_number: '+39 081 5556677',
      email: 'antonio@digitalstore.it',
      branch: 'LMIT-HS-NAPLES',
      zone: 'HS NAPOLI ZONE 2',
      created_by: 'admin-1',
      created_by_name: 'Marco Rossi',
      created_at: '2024-02-05T09:00:00Z',
    },
    {
      id: 'ret-4',
      company_name: 'Bari Electronics SRL',
      vat_number: 'IT44455566677',
      address_lane: 'Via Sparano',
      house_number: '78',
      city: 'Bari',
      postcode: '70121',
      contact_person_name: 'Giuseppe',
      contact_person_surname: 'Russo',
      mobile_number: '+39 320 111 2233',
      landline_number: '+39 080 3334455',
      email: 'giuseppe@barielectronics.it',
      branch: 'LMIT-HS-BARI',
      zone: 'HS BARI ZONE 1',
      created_by: 'admin-1',
      created_by_name: 'Marco Rossi',
      created_at: '2024-02-07T14:00:00Z',
    },
    {
      id: 'ret-5',
      company_name: 'Padova Smart Tech',
      vat_number: 'IT33344455566',
      address_lane: 'Via Roma',
      house_number: '55',
      city: 'Padova',
      postcode: '35122',
      contact_person_name: 'Chiara',
      contact_person_surname: 'Fontana',
      mobile_number: '+39 347 222 3344',
      landline_number: '+39 049 7778899',
      email: 'chiara@padovasmart.it',
      branch: 'LMIT-HS-PADOVA',
      zone: 'HS PADOVA ZONE 1',
      created_by: 'admin-1',
      created_by_name: 'Marco Rossi',
      created_at: '2024-02-10T08:00:00Z',
    },
    {
      id: 'ret-6',
      company_name: 'Milano Centro Retail',
      vat_number: 'IT22233344455',
      address_lane: 'Corso Buenos Aires',
      house_number: '33',
      city: 'Milano',
      postcode: '20124',
      contact_person_name: 'Marco',
      contact_person_surname: 'Villa',
      mobile_number: '+39 349 333 4455',
      landline_number: '+39 02 8889900',
      email: 'marco@milanopretail.it',
      branch: 'LMIT-HS-MILAN',
      zone: 'HS MILANO ZONE 2',
      created_by: 'fse-2',
      created_by_name: 'Alessandro Ricci',
      created_at: '2024-02-12T16:00:00Z',
    },
  ]

   const contracts: Contract[] = [
     {
       id: 'con-1',
       retailer_id: 'ret-1',
       retailer_name: 'Elettronica Milano SRL',
       contract_number: 'LMIT-2024-0001',
       status: 'SIGNED',
       retailer_signature: 'data:image/png;base64,iVBORw0KGgo=',
       staff_signature: 'data:image/png;base64,iVBORw0KGgo=',
       contract_date: '2024-02-01',
       created_by: 'fse-1',
       created_by_name: 'Sofia Conti',
       branch: 'LMIT-HS-MILAN',
       zone: 'HS MILANO ZONE 1',
       pdf_url: null,
       retailer_email: 'roberto@elettronica-milano.it',
       staff_email: 'fse.milan1@lmit.com',
       created_at: '2024-02-01T10:30:00Z',
     },
     {
       id: 'con-2',
       retailer_id: 'ret-2',
       retailer_name: 'Tech Roma SPA',
       contract_number: 'LMIT-2024-0002',
       status: 'SENT',
       retailer_signature: 'data:image/png;base64,iVBORw0KGgo=',
       staff_signature: 'data:image/png;base64,iVBORw0KGgo=',
       contract_date: '2024-02-03',
       created_by: 'fse-3',
       created_by_name: 'Valentina Leone',
       branch: 'LMIT-HS-ROME',
       zone: 'HS ROMA ZONE 1',
       pdf_url: null,
       retailer_email: 'francesca@techroma.it',
       staff_email: 'fse.rome1@lmit.com',
       created_at: '2024-02-03T11:30:00Z',
     },
     {
       id: 'con-3',
       retailer_id: 'ret-3',
       retailer_name: 'Digital Store Napoli',
       contract_number: 'LMIT-2024-0003',
       status: 'PENDING',
       retailer_signature: null,
       staff_signature: null,
       contract_date: '2024-02-05',
       created_by: 'admin-1',
       created_by_name: 'Marco Rossi',
       branch: 'LMIT-HS-NAPLES',
       zone: 'HS NAPOLI ZONE 2',
       pdf_url: null,
       retailer_email: 'antonio@digitalstore.it',
       staff_email: 'admin@lmit.com',
       created_at: '2024-02-05T09:30:00Z',
     },
     {
       id: 'con-4',
       retailer_id: 'ret-4',
       retailer_name: 'Bari Electronics SRL',
       contract_number: 'LMIT-2024-0004',
       status: 'PENDING',
       retailer_signature: null,
       staff_signature: null,
       contract_date: '2024-02-07',
       created_by: 'admin-1',
       created_by_name: 'Marco Rossi',
       branch: 'LMIT-HS-BARI',
       zone: 'HS BARI ZONE 1',
       pdf_url: null,
       retailer_email: 'giuseppe@barielectronics.it',
       staff_email: 'admin@lmit.com',
       created_at: '2024-02-07T14:30:00Z',
     },
     {
       id: 'con-5',
       retailer_id: 'ret-6',
       retailer_name: 'Milano Centro Retail',
       contract_number: 'LMIT-2024-0005',
       status: 'SIGNED',
       retailer_signature: 'data:image/png;base64,iVBORw0KGgo=',
       staff_signature: 'data:image/png;base64,iVBORw0KGgo=',
       contract_date: '2024-02-12',
       created_by: 'fse-2',
       created_by_name: 'Alessandro Ricci',
       branch: 'LMIT-HS-MILAN',
       zone: 'HS MILANO ZONE 2',
       pdf_url: null,
       retailer_email: 'marco@milanopretail.it',
       staff_email: 'fse.milan2@lmit.com',
       created_at: '2024-02-12T16:30:00Z',
     },
   ]

  return { users, retailers, contracts }
}

export const useDataStore = create<DataState>()((set, get) => ({
  retailers: [],
  contracts: [],
  users: [],

  addRetailer: (retailer) =>
    set((state) => ({ retailers: [...state.retailers, retailer] })),

  updateRetailer: (id, data) =>
    set((state) => ({
      retailers: state.retailers.map((r) => (r.id === id ? { ...r, ...data } : r)),
    })),

  deleteRetailer: (id) =>
    set((state) => ({
      retailers: state.retailers.filter((r) => r.id !== id),
    })),

  addContract: (contract) =>
    set((state) => ({ contracts: [...state.contracts, contract] })),

  updateContract: (id, data) =>
    set((state) => ({
      contracts: state.contracts.map((c) => (c.id === id ? { ...c, ...data } : c)),
    })),

  deleteContract: (id) =>
    set((state) => ({
      contracts: state.contracts.filter((c) => c.id !== id),
    })),

  addUser: (user) =>
    set((state) => ({ users: [...state.users, user] })),

  updateUser: (id, data) =>
    set((state) => ({
      users: state.users.map((u) => (u.id === id ? { ...u, ...data } : u)),
    })),

  deleteUser: (id) =>
    set((state) => ({
      users: state.users.filter((u) => u.id !== id),
    })),

  initializeDemoData: () => {
    const { users, retailers, contracts } = get()
    if (users.length === 0 && retailers.length === 0 && contracts.length === 0) {
      const data = generateDemoData()
      set({ users: data.users, retailers: data.retailers, contracts: data.contracts })
    }
  },
}))
