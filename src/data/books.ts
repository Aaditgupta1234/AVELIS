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
