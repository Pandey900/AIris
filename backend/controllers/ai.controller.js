import * as ai from "../services/ai.service.js";

export const getResult = async (req, res) => {
  try {
    const { prompt } = req.query;
    const result = await ai.generateResult(prompt);
    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
