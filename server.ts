import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded Gemini AI client to avoid crashing on start if API key is missing
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY" && key.trim() !== "") {
      try {
        aiClient = new GoogleGenAI({
          apiKey: key,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build",
            },
          },
        });
      } catch (e) {
        console.error("Failed to initialize GoogleGenAI client:", e);
      }
    }
  }
  return aiClient;
}

// 1. Dynamic weather endpoint simulating real-time details
app.get("/api/weather", (req, res) => {
  const city = (req.query.city as string) || "上海市";

  // Create realistic weather depending on the city name
  let temp = 22;
  let weatherText = "多云转晴";
  let high = 26;
  let low = 18;
  let humidity = 65;
  let uvIndex = "中等";
  let windSpeed = "微风 2级";

  const hour = new Date().getHours();

  if (city.includes("北京")) {
    temp = 24;
    weatherText = "晴";
    high = 29;
    low = 15;
    humidity = 40;
    uvIndex = "强";
    windSpeed = "北风 3级";
  } else if (city.includes("深圳") || city.includes("广州")) {
    temp = 28;
    weatherText = "阵雨";
    high = 32;
    low = 25;
    humidity = 82;
    uvIndex = "极强";
    windSpeed = "无风 1级";
  } else if (city.includes("成都")) {
    temp = 20;
    weatherText = "阴";
    high = 23;
    low = 16;
    humidity = 75;
    uvIndex = "弱";
    windSpeed = "南风 1级";
  } else if (city.includes("杭州")) {
    temp = 23;
    weatherText = "小雨";
    high = 25;
    low = 19;
    humidity = 80;
    uvIndex = "弱";
    windSpeed = "东风 2级";
  }

  // Fluctuating temp depending on time of day
  if (hour < 8 || hour > 20) {
    temp = Math.max(low, temp - 4);
  } else if (hour >= 12 && hour <= 16) {
    temp = Math.min(high, temp + 3);
  }

  res.json({
    city,
    date: new Date().toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "long" }),
    weather: weatherText,
    temperature: temp,
    feelsLike: temp - 1,
    humidity,
    high,
    low,
    uvIndex,
    windSpeed,
    source: "和风天气实时同步"
  });
});

// 2. Outfit recommendations from Gemini API or rules engine fallback
app.post("/api/recommend", async (req, res) => {
  const { weather, itineraries, recentFeel } = req.body;

  const city = weather?.city || "上海市";
  const currentTemp = weather?.temperature ?? 22;
  const weatherState = weather?.weather || "多云";
  const highTemp = weather?.high ?? 26;
  const lowTemp = weather?.low ?? 18;

  // Format itinerary summary
  const itinSummary = Array.isArray(itineraries) && itineraries.length > 0
    ? itineraries.map((it: any, index: number) =>
        `${index + 1}. 时间: ${it.time}, 场景: ${it.name}, 预计温度: ${it.temperature}°C, 体感倾向: ${it.feel || "舒适"}`
      ).join("\n")
    : "全天室外活动为主";

  const prompt = `你是一个专业的衣橱穿搭管家。用户正在北京时间 ${new Date().toLocaleString()} 规划当天的穿搭决策。
请结合室外天气和用户填写的【全天行程及场景温度】，给出一份科学、实用的全天穿衣建议。

【当前天气信息】
- 城市: ${city}
- 实时温度: ${currentTemp}°C (最高温: ${highTemp}°C / 最低温: ${lowTemp}°C)
- 天气状态: ${weatherState}
- 用户最近整体体感偏好: ${recentFeel || "适中"}

【用户全天行程安排】
${itinSummary}

【穿搭核心原则】
- 穿衣建议必须综合用户一天的完整行程，不为每个场景分别给出彼此割裂的建议。最终建议应是一套【可通过穿脱应对全天温差】的方案（即多层叠穿法，如短袖+薄开衫+防风外套）。
- 建议只需描述【衣物类型、材质与薄厚】，不建议输出特定的直筒、法式等版型、特定美学风格、或花俏的潮流款式。

请返回 JSON 格式数据，结构如下：
{
  "recommendedOutfit": "一套能够应对全天所有场景温差的推荐叠穿穿搭，说明应该穿什么、带什么、怎么穿脱。例如: '短袖T恤 + 轻薄防风西装外套 + 凉爽直筒长裤' (注意：请只描述衣物类型与薄厚)。",
  "layeringExplanation": "对全天室外天气与关键行程场景（如：冷气足的办公室或闷热的地铁）之间温差的详细温度依据解释。",
  "tips": [
    "针对不同行程场景的具体穿戴/存放技巧，比如：'在地铁通勤时建议将薄针织外套收进背包，进入办公室空调房后再穿上。'",
    "另一个具体的体感应对建议。"
  ],
  "suggestedItems": ["短袖T恤", "薄西装外套", "休闲长裤", "白色板鞋"]
}`;

  const client = getAiClient();

  if (client) {
    try {
      console.log("Calling Gemini API to get personal outfit advice...");
      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              recommendedOutfit: { type: Type.STRING },
              layeringExplanation: { type: Type.STRING },
              tips: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              suggestedItems: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["recommendedOutfit", "layeringExplanation", "tips", "suggestedItems"]
          }
        }
      });

      const text = response.text;
      if (text) {
        const result = JSON.parse(text.trim());
        return res.json({ ...result, isAi: true });
      }
    } catch (err) {
      console.error("Gemini API error:", err);
    }
  }

  // Fallback Rule-based engine when API key is missing or calls fail
  console.log("Using localized temperature-rules engine for recommendation.");

  let recommendedOutfit = "";
  let layeringExplanation = "";
  let tips: string[] = [];
  let suggestedItems: string[] = [];

  if (currentTemp < 10) {
    recommendedOutfit = "温暖保暖层叠装：轻便羽绒服/羊毛大衣 + 羊绒毛衣/卫衣 + 保暖内衣 + 厚实长裤。";
    layeringExplanation = `今天室外气温低至 ${currentTemp}°C，体感寒冷。但办公室内通常温暖。多层穿法能让您在通勤时防风抗寒，在室内工作时脱掉厚重外套保持舒适。`;
    tips = [
      "早晚通勤风大寒冷，建议佩戴羊毛围巾或轻便帽子保护头部与颈部。",
      "室内暖气充足时，可脱去羽绒服，仅保留保暖内衣与毛衣即可，避免出汗。"
    ];
    suggestedItems = ["羽绒服", "厚毛衣", "保暖内衣", "毛料长裤", "马丁靴"];
  } else if (currentTemp >= 10 && currentTemp < 16) {
    recommendedOutfit = "春秋叠穿套装：中厚风衣/夹克外套 + 针织衫/长袖T恤 + 牛仔裤/休闲长裤。";
    layeringExplanation = `今天室外温度在 ${currentTemp}°C 左右，属于微凉天气。地铁或商场等密闭空间可能会有些闷热，而进入办公室则比较稳定，适合通过外套加内搭的组合来进行调节。`;
    tips = [
      "早晚通勤凉意明显，建议穿着有防风效果的风衣或牛仔夹克。",
      "若地铁中体感闷热，可解开外套拉链或扣子，增加空气流通。"
    ];
    suggestedItems = ["经典风衣", "薄款针织衫", "休闲长裤", "复古板鞋"];
  } else if (currentTemp >= 16 && currentTemp < 21) {
    recommendedOutfit = "舒适随行叠穿：轻便西装外套/针织开衫 + 长袖棉质T恤 + 经典牛仔裤/直筒西裤。";
    layeringExplanation = `当前气温约为 ${currentTemp}°C，室外宜人。然而在空调运转的办公室（约22°C）里，长期久坐容易产生凉意，多备一件薄外套至关重要。`;
    tips = [
      "棉质长袖T恤兼具透气与保暖，适合作为核心内搭。",
      "一件轻便的西装外套不仅能应对温差，也极适合通勤与职场场景的体面转换。"
    ];
    suggestedItems = ["薄外套/西装", "长袖T恤", "牛仔长裤", "平底乐福鞋"];
  } else if (currentTemp >= 21 && currentTemp < 26) {
    recommendedOutfit = "灵活空调应对装：薄开衫/防晒衬衫外套 + 纯棉短袖T恤 + 薄款休闲长裤。";
    layeringExplanation = `今天最高温达 ${highTemp}°C，室外温暖舒适。但办公室、商场或公共交通工具的冷气（约20°C）通常开得很足，冷热交替频繁，轻薄外套可以随时应对空调凉意。`;
    tips = [
      "建议外套选择轻薄、易收纳的棉麻衬衫或开衫，不穿时可以直接搭在肩上或放进包里。",
      "选择透气吸汗的纯棉短袖作为基础内搭，可确保在户外走动时不觉得闷热。"
    ];
    suggestedItems = ["防晒开衫", "短袖T恤", "九分休闲裤", "透气运动鞋"];
  } else {
    recommendedOutfit = "夏日清凉防护装：排汗短袖T恤 + 冰丝防晒外衣 + 军绿色短裤/薄款长裤。";
    layeringExplanation = `今日室外温度高达 ${currentTemp}°C，烈日当头。而地铁与写字楼等空调环境温差可能超过8°C。推荐采用超薄外衣遮阳并阻挡室内冷风。`;
    tips = [
      "随身带一件超轻薄的防晒风衣或空调衫，应对办公室持久冷气，避免感冒。",
      "户外步行请做好物理防晒，多选用棉、麻、冰丝等高透气天然纤维织物。"
    ];
    suggestedItems = ["短袖T恤", "超薄防晒衫", "透气短裤", "运动凉鞋"];
  }

  // Apply user physical feedback bias if available
  if (recentFeel === "偏冷") {
    recommendedOutfit = "【增加保暖层】" + recommendedOutfit;
    tips.unshift("由于您最近体感偏冷，建议比平常多带一件保暖马甲或稍厚一些的外套。");
  } else if (recentFeel === "偏热") {
    recommendedOutfit = "【增加透气度】" + recommendedOutfit;
    tips.unshift("由于您最近体感偏热，内搭请选择极度透气的面料，并建议尽量穿着宽松衣物。");
  }

  res.json({
    recommendedOutfit,
    layeringExplanation,
    tips,
    suggestedItems,
    isAi: false
  });
});

// Serve frontend assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
