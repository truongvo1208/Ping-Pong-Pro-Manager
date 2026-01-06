
import { GoogleGenAI, Type } from "@google/genai";

// Luôn sử dụng API Key từ process.env.API_KEY để bảo mật và linh hoạt trên Cloud Run
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getSmartInsight = async (stats: any) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Bạn là một chuyên gia quản lý CLB bóng bàn. Dựa trên dữ liệu sau: ${JSON.stringify(stats)}, hãy đưa ra 1 câu nhận xét ngắn và 1 lời khuyên thực tế bằng tiếng Việt.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            insight: { type: Type.STRING, description: "Nhận xét về tình hình hiện tại" },
            advice: { type: Type.STRING, description: "Lời khuyên kinh doanh cụ thể" }
          },
          required: ["insight", "advice"]
        }
      }
    });
    
    const text = response.text;
    if (!text) throw new Error("Mô hình không trả về dữ liệu.");
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return { 
      insight: "Đang thu thập thêm dữ liệu để phân tích...", 
      advice: "Duy trì ghi chép các lượt chơi đều đặn để nhận được phân tích chính xác nhất." 
    };
  }
};
