export interface TestimonialItem {
  id: string;
  quote: string;
  name: string;
  title: string;
  img: string;
}

export const testimonials: TestimonialItem[] = [
  {
    id: "t1",
    quote: "AVELIS has transformed my relationship with digital reading. It no longer feels like a utility, but a ritual. The typography and dark environment are unparalleled.",
    name: "Clara Hemmingway",
    title: "Literary Critic",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuA2b-KANMlJL4ie-hWzoBx6aV8QEfOqJZD0lrZitnvSyZWLlMebHMEz1fmmAxIPSizP8O_U0OsCN0sK8aNjd17tdJQOhGLxH00x0P3wqiN4UvN3WfuZyNLw3qbGX2Hz1JxML4k0ip1pGMjlReyKwyzj2bOGhpJlK2OlhoTIWIfUDxapzZNzEyWcDpXOfzhochGvc3qtUFCC4qOCpFkYKJ_TgjbfGtsRDAghaTsyTpx2TAts9GRg3SwxVVO_UXu6yeGFdLCpRy4oFo-U"
  },
  {
    id: "t2",
    quote: "The archive of first editions is a scholar's dream. Being able to cross-reference physical rarity with digital convenience in such a beautiful interface is remarkable.",
    name: "Arthur Penhaligon",
    title: "Archival Historian",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuC-6cn_FuVEPCaVWTXkKxuBXhbMhiEnZ7_A-4MbNp1EOrEuredN_GxJEznKkSeyVPIx4-MSrFb0gPGK54ZU1jEZ8ug7MKD38athBd8RCVnsJQplbg-rDHuBXoixkXizN_P31-8b50aCzJ-XnNhM722OJef9RT9_269D25h5DPMsMjWSLoNtIsdW8sC5rDiv84AMYpJLAOErPpRnLhpyzTt4Tw2boUPIrwlXCr0fqFpdJs17bD7bQ851NPI5Ivr1MD40Vm6mHlqR6v90"
  }
];
