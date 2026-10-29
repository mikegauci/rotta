export const PAGE_FIELDS: Record<
  string,
  Record<
    string,
    { label: string; value: string; kind?: "image" | "order" | "select" }
  >
> = {
  "": {
    heroMode: { label: "Hero background", value: "video", kind: "select" },
    heroVideo: {
      label: "Hero video URL (upload in Media, then copy its URL)",
      value: "/home/garage-stories.mp4",
    },
    heroImage: {
      label: "Hero image / video poster",
      value: "wp/2021/01/Parsons-Maserati-1.webp",
      kind: "image",
    },
    videoUrl: { label: "Watch button URL", value: "/watch/" },
    directoryUrl: { label: "Directory button URL", value: "/my-business/" },
    shopUrl: { label: "Shop button URL", value: "/shop/" },
    eventsUrl: { label: "Events button URL", value: "/events/" },
    videoId: { label: "Featured YouTube video ID", value: "XKpF1zM6lWA" },
    storyUrl: { label: "Featured story URL", value: "/best-in-show/" },
    storyImage: {
      label: "Featured story image",
      value: "wp/2023/06/Blogs-Thumbnails-600x315-13.webp",
      kind: "image",
    },
    homeOrder: {
      label: "Homepage section order",
      value: "intro,directory,shop,events",
      kind: "order",
    },
    heading: {
      label: "Hero heading",
      value: "Celebrating Malta’s\nAutomotive Community",
    },
    description: {
      label: "Hero description",
      value:
        "Fuelled by two young creatives to preserve our automotive heritage,\nkeeping it alive whilst inspiring those who have been missing out.",
    },
    watchHeading: {
      label: "Watch section heading",
      value: "Watch a dose of\nart on wheels",
    },
    videoTitle: { label: "Featured video title", value: "Super 90" },
    videoDescription: {
      label: "Featured video description",
      value:
        "Watch our latest episodes where we share the passion for art in motion",
    },
    videoButton: { label: "Watch button", value: "Watch all videos" },
    readHeading: {
      label: "Stories section heading",
      value: "Read the latest\nautomotive stories",
    },
    storyTitle: { label: "Featured story title", value: "Best in Show" },
    storyDescription: {
      label: "Featured story description",
      value: "Check out our latest blog post.",
    },
    storyButton: { label: "Story button", value: "Read" },
    directoryHeading: {
      label: "Directory heading",
      value: "Join the community\nand get discovered",
    },
    directoryButton: { label: "Directory button", value: "Add my Business" },
    shopHeading: { label: "Shop heading", value: "Shop with Passion" },
    shopButton: { label: "Shop button", value: "Visit" },
    eventsHeading: { label: "Events heading", value: "Automotive Events" },
    eventsButton: { label: "Events button", value: "View Calendar of Events" },
  },
  "contact-us": {
    heading: { label: "Hero heading", value: "Get In Touch" },
    description: {
      label: "Hero description",
      value: "Leave us a message with any questions you have.",
    },
  },
  blog: {
    heading: { label: "Hero heading", value: "Check out our blog" },
    description: {
      label: "Hero description",
      value: "Read what we have to say on the local automotive scene.",
    },
  },
  watch: {
    heading: {
      label: "Hero heading",
      value: "Sharing a passion\nfor art in motion",
    },
    description: {
      label: "Hero description",
      value:
        "Watch our latest episodes on some of the best local car stories\nand garages! Buckle up! It’s going to be a ride to remember!",
    },
  },
  events: {
    heading: { label: "Upcoming events heading", value: "Upcoming Events" },
    calendarHeading: { label: "Calendar heading", value: "Calendar of Events" },
  },
};
