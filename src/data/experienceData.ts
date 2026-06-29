export interface ExperienceStepData {
  id: string;
  title: string;
  description: string;
  image?: string;
  linkText?: string;
  layoutDirection: "ltr" | "rtl";
  badge?: {
    title: string;
    description: string;
  };
  listItems?: string[];
  visualType?: "image" | "dashboard";
}

export const experienceSteps: ExperienceStepData[] = [
  {
    id: "discover",
    title: "Discover",
    description: "Our intelligent archival system doesn't just search; it understands. Map your intellectual curiosity across a universe of rare manuscripts and first editions.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBC2ItH-kyJw0ENo3bP3hmZ9CvtMBkavBEraewYN0aY3rft3Fpemmort9EhwzqrOqrMV_48cqeNIwDzZXST7Sv8buGfhptztxkMXlTHKJgOvJqqMWKuzfnWe6z2XKPQKPp5L8rKJ-xlwLIDBcrWsLBDlRhQ9T97_RFrRhnLKU1_t1RBo9qqmosdbRPZTpUykKwP5H1r6muT8NkR34LUn7t5szFYUaIcTRSvOMBXWo2kepfg-758ZCebzGdhRXYbTH7HOn9xCAGRDIcm",
    linkText: "EXPLORE CURATIONS",
    layoutDirection: "ltr",
    badge: {
      title: "QUERY ENGINE V2.4",
      description: "Semantic relevance active"
    }
  },
  {
    id: "borrow",
    title: "Borrow",
    description: "Secure temporary stewardship of history’s most profound works. Our digital lending protocol preserves the weight and significance of the physical artifact.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCY_R6_hf5TwwRfsh4-l8GyxX7kvv2VS5ZtXkRey9HqowwfEe_iU4uQ5ZyXLf68_imBesEcuj2VMSyxIzlN3xqfmWtzZODv2F83TiOBfkUHhUdyFenTD6U-V45TF0vhHoDU7Yr6rX-f6nn8QzJHpisAWEJPzNY9jfl_mQk3q_7L5fYZDg5nKkIy7Y12isnWZ_IS_D1Nu2-KrQtEIBMoOm06echyt2U_fkCE1rcL3CLJfa9jRvbrMP84K8izMBi_YyOjNxalisWLqknf",
    linkText: "THE LENDING PROTOCOL",
    layoutDirection: "rtl"
  },
  {
    id: "read",
    title: "Read",
    description: "A reading environment designed for deep focus. Warm highlights, bespoke typography, and a distraction-free interface that honors the silence of the library.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDOPqFtY7tZx8T7z9Wrmo4wjC_PYwsg1OpYu7rDmmE1HiLcBJCoJAkYZ-zXl6s9mgk6uyJ_bUlxtScWa7nKPm-bhvVLHSEMOhTSxe-5j5L08s7ZBwjHdpHe_yJEFyN8xTuEh4gpLN6NwR3yx_uUpyq0R9tkhT8m_dGiZ5DbInWQgpnFeSv1_0CqHcELuv1iTERP-syOY0Y5Cti4r28a663ZoKX3S6ICrLUt5Mmt6P3Fw2N-I_5xvToqpYVfeltaH5FQLhQA3Dlj4SFX",
    layoutDirection: "ltr",
    listItems: [
      "Custom Serif Optimizations",
      "Ambient Tone Adjustment"
    ]
  },
  {
    id: "grow",
    title: "Grow",
    description: "Visualize your journey through the canon of human thought. Our insight engine tracks your reading depth and thematic explorations to suggest your next vital discovery.",
    visualType: "dashboard",
    linkText: "VIEW PERSONAL ARCHIVE",
    layoutDirection: "rtl"
  }
];
