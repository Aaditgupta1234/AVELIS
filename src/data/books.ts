export interface BookItem {
  id: string;
  title: string;
  author: string;
  image: string;
  tag?: string;
}

export const featuredBooks: BookItem[] = [
  {
    id: "f1",
    title: "The Silent Library",
    author: "JULIAN VANCE • 2024",
    tag: "Editor's Pick",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBnTfko1oBkPcKBiPzij8xCRpy--PxCYJj60yN3yhd9JocIcU4ajGcb7xoDLYFhqTuuw2uyACszZ4cNzdqm53i8FOWf0lX2wxECQbx0OmwLCJKA0TD396WkiCbKrrnHuj_Ra37lOFohhuA3-3Pvr9ATiM4pmS6CXjbfnSqAsM6rR-O3d6zR8iLwwXD5KiLyHO_dLSCAb11OFn65HuEYIKm5uxixK4TQFwst7LX-QOwqLjtyezOTvEDsMAymuocG-Ylv-OiqvFV5a0zG"
  },
  {
    id: "f2",
    title: "Echoes of Gold",
    author: "ELARA STERLING",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBU52ijSLmU_qjFNUOAerhdUpQteDYp-nWFtLh4voF6DSU1RngPE1bZDKVyFE_Ins5b-fhz-TrYm1qt2hcbhLpWVUW1zU0TLNCasw1eIY670L4VxFWnA8DGthNY8apX-Nf1Ls_wAuTQxzX7InGTYZnEji853jaJRGQYDVe7t5YnSOk0BI2sZOjGwDI8Tpg5qAOGSvPMJiv5XPUzIbspiXhX-LrfHMNLuTOH7BCEvrDngvT9YzV3GVjAVcQC74f7I0WGgk3DAT2cOk2Q"
  },
  {
    id: "f3",
    title: "The Botanical Guild",
    author: "DR. ARIS THORNE",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDeJgiCbSFFXnJYQlPQxoJEuc8uvF07iNbjx-4cy6obuU8uvCGy3KQy9GNov2qUFPpcCDfUJKsHpYE98S1FGQdL_x6aPw5ggWqUjDsSA8Zg1nrW492CEsPwHTtmxZ5YCXYnMpikOx-nMFlq3o8EMnARZTUflvpm3mF2XZ2tk_WsDnSESEjfECww2PB_aIa-OqpQZEZdsLySkc9vg1OmwQo6Ur9Weo_TEnBQtm69GnBidXM2wk4ZgU8cXW70NmOJlkyP7RF70rIzmt9z"
  }
];

export const editorPicks: BookItem[] = [
  {
    id: "e1",
    title: "The Silent Archive",
    author: "JULIAN VANCE",
    image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=2187&auto=format&fit=crop"
  },
  {
    id: "e2",
    title: "Mechanics of Time",
    author: "ELARA STERLING",
    image: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=2112&auto=format&fit=crop"
  },
  {
    id: "e3",
    title: "Botany of Desire",
    author: "ARIS THORNE",
    image: "https://images.unsplash.com/photo-1629196914169-1c93a0bfa9b8?q=80&w=2070&auto=format&fit=crop"
  },
  {
    id: "e4",
    title: "Digital Consciousness",
    author: "ALAN TURING",
    image: "https://images.unsplash.com/photo-1550399105-c4db5fb85c18?q=80&w=2071&auto=format&fit=crop"
  }
];

export const authorBooks = [
  "The Stranger", 
  "The Myth of Sisyphus", 
  "The Plague"
];

import type { Book } from "../types/library";

export const booksData: Book[] = [
  {
    id: "book-1",
    title: "The Last Alchemist",
    author: "Julian Vane",
    category: "HISTORICAL FICTION",
    rating: 4.8,
    coverImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuDMQB3jkGIU5u3rEq_hmwLWn-YUIwcqDfAk2hPxoB497MDBmFBxnBawqxCEVtXH9jnSd1pDFZIp4Ql_JHCy-e4QZa7JgGocWlxJm6cwxLIuyuEMOVRjcpNZ19qfLFGwR0_q6SoFEiIp1xqCzia6A1FJfP3CYSN75lwdZK8-Z8lP4R3XqcxjdNdn65HhoaITrvxH1gZI1ET8PfYzeUpwx4OvDJQ85nW_oqaimM7e5jZnNnFXrnE9MWVQHjAm_2smup5VkcOWsPKAt_Rd",
    year: 2023,
    available: true,
    description: "An intricate tale of magic, science, and political intrigue in 17th-century Prague."
  },
  {
    id: "book-2",
    title: "Digital Horizon",
    author: "Sarah Drasner",
    category: "SCIENCE & TECH",
    rating: 4.7,
    coverImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuCoxjPQp0Fc-RTlaci-39jiUP-R-FGRXRGVOEg1qXEfffM56xIz3FkoQDJt9mRCtBqW2h24WfLZ338JFr2EfSTfQCws4JIy-P11Tj17QcKHSCfsGnAsOewOm3lCKgP8pC2BPcA4nPhWBmiG3q8CT7MQqjXGMBIO_Mqq67nbLfqCQz7HeAtuSraIi1diDAP7988lfdaY8GwkBUF6rfGr98mpH9cZdrF74fCU-VEcKHpKMLgpziLm3fBO67MehNVidU93qhdSeHOEi0M3",
    year: 2024,
    available: true,
    description: "A forward-looking exploration of human-computer interface design and the next era of digital collaboration."
  },
  {
    id: "book-3",
    title: "The Stoic Mind",
    author: "Marcus Aurelius",
    category: "PHILOSOPHY",
    rating: 4.9,
    coverImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuBGoBam_GH0kHTSZDXI6POwJ0VFdE-lxSfB_SoWGq3mdm_hHHjlBSuliDjLxUK46VOC9Kv7UBAMpCAu9pKB-cF6h7EiAfWvWeVPlQcdLUcefi7HSQ5ka0wKg1YYPkYDLMQGmeIQjQct1OP8pumhgm_xTU-oxns5mOfovHBluByD5t_CcOHfwsB-fLYqwD-GB6f7oiQyGIG4N4Pn7XV_gTmUoGrySf975ZNq8dmx0vNty_hzk8PMl6z-J6vYTP7Jf9wSxovnF-iYfBmO",
    year: 2021,
    available: true,
    description: "A collection of personal writings and reflections on self-discipline, ethics, and resilience in adversity."
  },
  {
    id: "book-4",
    title: "Odyssey Redux",
    author: "Homer (Modern Translation)",
    category: "CLASSICS",
    rating: 5.0,
    coverImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuDlf9hEic-gPNjryhymDLPYQ2Gpn2dZkTNkoF-2nlY4faqACRj98pUIBfayPdD2iNuujzG9ik81rpvDmDKyFBroA5a931KQhwYI-0uzyfd1NeTXUTPCJuVAGbMfbAig0XATuLiUPSdzMZESnYu4lYSmfMjLcm5dJ3UxLoX9h5KvtmgM1J6eMTZdoYOB9iAov9GBuF7Rb-5z2J4KDPMTRm9gCwmyD6tiD4PX4jjrpOOnHhBt3UADobcjOK3nxUZp8GV31ifGMOVDtjt2",
    year: 2024,
    available: true,
    description: "A breathtaking modern translation of the epic journey of Odysseus, preserving the lyrical power of the original."
  },
  {
    id: "book-5",
    title: "Tesla: The Inventor",
    author: "W. Bernard Carlson",
    category: "BIOGRAPHY",
    rating: 4.6,
    coverImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuCpLmZq1hDeLFu55RTUdkogiqEBNoCNxl5Xt7nhgZ5IZ42b6Eu4QggN0l7KlNMlXQ8nAM1SEGZrkPj3UpZj1rYRX_OdqmAfeS-KzvbqY6FvmEH_i9d8NZjDRirc-9w_4_8l8Yhq4mRpMCFDJyWLHKDgFcq3FHd27buJLA5v8N4AWZlvbIt0PWdyd9i_iqk5vf4O3lnJzz02WLGM2FpqVRH6rR0HzhTNoArLE_28JAsLHENk8wrtZWHja7a7AIbrGHhWPdVj7qFt3tu6",
    year: 2013,
    available: true,
    description: "A definitive biography of Nikola Tesla, detailing his groundbreaking discoveries and complex life."
  },
  {
    id: "book-6",
    title: "The Silent Library",
    author: "Julian Vance",
    category: "MYSTERY",
    rating: 4.8,
    coverImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuBnTfko1oBkPcKBiPzij8xCRpy--PxCYJj60yN3yhd9JocIcU4ajGcb7xoDLYFhqTuuw2uyACszZ4cNzdqm53i8FOWf0lX2wxECQbx0OmwLCJKA0TD396WkiCbKrrnHuj_Ra37lOFohhuA3-3Pvr9ATiM4pmS6CXjbfnSqAsM6rR-O3d6zR8iLwwXD5KiLyHO_dLSCAb11OFn65HuEYIKm5uxixK4TQFwst7LX-QOwqLjtyezOTvEDsMAymuocG-Ylv-OiqvFV5a0zG",
    year: 2024,
    available: false,
    description: "A noir thriller set in a gothic university library where rare manuscripts hold keys to unsolved murders."
  },
  {
    id: "book-7",
    title: "Echoes of Gold",
    author: "Elara Sterling",
    category: "MYSTERY",
    rating: 4.5,
    coverImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuBU52ijSLmU_qjFNUOAerhdUpQteDYp-nWFtLh4voF6DSU1RngPE1bZDKVyFE_Ins5b-fhz-TrYm1qt2hcbhLpWVUW1zU0TLNCasw1eIY670L4VxFWnA8DGthNY8apX-Nf1Ls_wAuTQxzX7InGTYZnEji853jaJRGQYDVe7t5YnSOk0BI2sZOjGwDI8Tpg5qAOGSvPMJiv5XPUzIbspiXhX-LrfHMNLuTOH7BCEvrDngvT9YzV3GVjAVcQC74f7I0WGgk3DAT2cOk2Q",
    year: 2022,
    available: true,
    description: "An investigative journalist uncovers a secret society operating in the shadows of London's financial elite."
  },
  {
    id: "book-8",
    title: "The Botanical Guild",
    author: "Dr. Aris Thorne",
    category: "SCIENCE & TECH",
    rating: 4.7,
    coverImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuDeJgiCbSFFXnJYQlPQxoJEuc8uvF07iNbjx-4cy6obuU8uvCGy3KQy9GNov2qUFPpcCDfUJKsHpYE98S1FGQdL_x6aPw5ggWqUjDsSA8Zg1nrW492CEsPwHTtmxZ5YCXYnMpikOx-nMFlq3o8EMnARZTUflvpm3mF2XZ2tk_WsDnSESEjfECww2PB_aIa-OqpQZEZdsLySkc9vg1OmwQo6Ur9Weo_TEnBQtm69GnBidXM2wk4ZgU8cXW70NmOJlkyP7RF70rIzmt9z",
    year: 2023,
    available: true,
    description: "A comprehensive history of early botany and the secret codes used by herbalists to protect their discoveries."
  },
  {
    id: "book-9",
    title: "Principles of Capital",
    author: "Lorenzo de' Medici",
    category: "BUSINESS",
    rating: 4.9,
    coverImage: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&q=80&w=600",
    year: 2020,
    available: true,
    description: "A modern perspective on the financial and cultural patronage systems of Renaissance Italy."
  },
  {
    id: "book-10",
    title: "Meditations on Nature",
    author: "Henry Thoreau",
    category: "LITERATURE",
    rating: 4.8,
    coverImage: "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&q=80&w=600",
    year: 2021,
    available: true,
    description: "Reflective essays on simple living, self-reliance, and the spiritual qualities of the wilderness."
  }
];

