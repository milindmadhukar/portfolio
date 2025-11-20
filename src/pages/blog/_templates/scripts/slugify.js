module.exports = async (params) => {
  const { quickAddApi: { inputPrompt } } = params;
  
  // Get the blog post title from the user
  const title = await inputPrompt("Blog Post Title:");
  
  if (!title) {
    throw new Error("Title is required");
  }
  
  // Slugify the title
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_]+/g, '-')   // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '');  // Remove leading/trailing hyphens
  
  // Return both the original title and the slug
  return {
    title: title,
    slug: slug
  };
};
