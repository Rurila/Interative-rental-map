import { GoogleGenAI, Type, Schema } from "@google/genai";
import { RentalRequest, ItemStat } from "../types";
import { PC4_ZONES } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// Schema for generating synthetic rental requests
const requestSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    requests: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          item: { type: Type.STRING },
          postcode: { type: Type.STRING, description: "A full valid Amsterdam postcode including letters, e.g., 1012 AB" },
          description: { type: Type.STRING },
        },
        required: ["item", "postcode", "description"],
      },
    },
  },
};

export const generateMockData = async (count: number = 5): Promise<Omit<RentalRequest, 'id' | 'lat' | 'lng' | 'date' | 'zoneId'>[]> => {
  try {
    const model = 'gemini-2.5-flash';
    // We ask for full postcodes now to match our new precision requirement
    const prompt = `Generate ${count} realistic rental/borrowing requests for residents in Amsterdam. 
    Use diverse full postcodes (e.g. 1012 JS, 1054 AA) primarily from Centrum (1011-1018) and West (1050-1059).
    Items should be typical neighborly borrowing needs.`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: requestSchema,
        temperature: 0.7,
      }
    });

    const json = JSON.parse(response.text || '{ "requests": [] }');
    return json.requests;
  } catch (error) {
    console.error("Gemini Mock Data Error:", error);
    // Fallback data if API fails
    return [
      { item: "Power Drill", postcode: "1012 AB", description: "Need to hang some shelves." },
      { item: "Folding Chairs", postcode: "1054 XT", description: "Hosting a dinner party." },
      { item: "Cargo Bike", postcode: "1011 PZ", description: "Moving some boxes." },
    ];
  }
};

export const analyzeDistrictTrends = async (contextName: string, items: ItemStat[]): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    const itemList = items.map(i => `${i.name} (${i.count})`).join(', ');
    const prompt = `Analyze the borrowing needs for the Amsterdam area: ${contextName}.
    The current requests are: ${itemList}.
    Provide a concise, 2-sentence insight about the lifestyle or current events in this specific micro-neighborhood based on these items.`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text || "Could not analyze trends at this time.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "AI analysis unavailable.";
  }
};