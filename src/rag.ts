import { supabase } from "./supabaseClient";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper to extract a keyword from the question
function extractKeyword(question: string): string {
  const lower = question.toLowerCase();
  if (lower.includes("defi")) return "DeFi";
  if (lower.includes("ethereum")) return "Ethereum";
  if (lower.includes("polygon")) return "Polygon";
  if (lower.includes("aave")) return "Aave";
  if (lower.includes("uniswap")) return "Uniswap";
  if (lower.includes("solana")) return "Solana";
  // Add more keywords as needed
  return question;
}

export async function answerQuestion(question: string): Promise<string> {
  // Extract a keyword for better matching
  const keyword = extractKeyword(question);

  // First try to find exact matches in the database
  const { data, error } = await supabase
    .from("grant_metadata")
    .select("name, details, link, category, subcategory")
    .or(`name.ilike.*${keyword}*,details.ilike.*${keyword}*,category.ilike.*${keyword}*,subcategory.ilike.*${keyword}*`)
    .limit(5);

  if (error) {
    console.error("Supabase error:", error);
    throw new Error("Database error occurred");
  }

  console.log("Supabase data:", data);

  if (data && data.length > 0) {
    // Group grants by category if available
    const grantsByCategory = data.reduce((acc: { [key: string]: any[] }, grant) => {
      const category = grant.category || "Other";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(grant);
      return acc;
    }, {});

    // Format the response with categories and clickable links
    const formattedResponse = Object.entries(grantsByCategory)
      .map(([category, grants]) => {
        const grantsList = grants
          .map(grant => 
            `Name: ${grant.name}\nDetails: ${grant.details}\nSubcategory: ${grant.subcategory || ''}\nLink: <a href="${grant.link}" target="_blank">${grant.link}</a>`
          )
          .join("\n\n");
        return `Category: ${category}\n\n${grantsList}`;
      })
      .join("\n\n---\n\n");

    return formattedResponse;
  }

  // If no exact matches found, use OpenAI to generate a response
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant specializing in Web3 and DeFi grants. 
          When asked about grants, provide specific information about available grants, 
          including their names, organizations, and direct links when possible. 
          Format your response in a clear, structured way.
          For any links, format them as HTML anchor tags like this: <a href="URL" target="_blank">URL</a>`,
        },
        { role: "user", content: question },
      ],
      max_tokens: 500,
    });

    const answer = completion.choices?.[0]?.message?.content?.trim();
    return answer || "Sorry, I couldn't find specific grant information for your query.";
  } catch (err: any) {
    console.error("OpenAI error:", err);
    return "Sorry, I couldn't find grant information and the AI assistant is currently unavailable.";
  }
}
