import React, { useState, useEffect } from "react";
import { User, Scene, ItineraryItem, Clothing, SavedOutfit } from "./types";
import {
  initialUser,
  initialScenes,
  initialItinerary,
  initialClothing,
  initialOutfits,
} from "./initialData";

// Modular Views
import WeChatLogin from "./components/WeChatLogin";
import HomeView from "./components/HomeView";
import SceneView from "./components/SceneView";
import WardrobeView from "./components/WardrobeView";
import TryOnView from "./components/TryOnView";
import ProfileView from "./components/ProfileView";

export default function App() {
  // 1. Core States with LocalStorage Hydration
  const [user, setUser] = useState<User>(() => {
    const saved = localStorage.getItem("ut_user");
    return saved ? JSON.parse(saved) : { ...initialUser, isLoggedIn: false }; // start logged out so they see the gorgeous WeChat login!
  });

  const [scenes, setScenes] = useState<Scene[]>(() => {
    const saved = localStorage.getItem("ut_scenes");
    if (saved) {
      const parsed = JSON.parse(saved) as Scene[];
      return parsed.map((s) => {
        if (s.remark === undefined) {
          return {
            ...s,
            remark: s.category === "地铁通勤" && s.id === "scene-metro" ? "高频活动" : "",
          };
        }
        return s;
      });
    }
    return initialScenes;
  });

  const [itineraries, setItineraries] = useState<ItineraryItem[]>(() => {
    const saved = localStorage.getItem("ut_itineraries");
    return saved ? JSON.parse(saved) : initialItinerary;
  });

  const [clothingList, setClothingList] = useState<Clothing[]>(() => {
    const saved = localStorage.getItem("ut_clothing");
    const list = saved ? JSON.parse(saved) : initialClothing;
    return list.map((item: Clothing) => {
      const match = initialClothing.find((c) => c.id === item.id);
      if (match && (match.image.startsWith("/input_file_") || item.image.startsWith("/input_file_"))) {
        return { ...item, image: match.image, name: match.name, color: match.color };
      }
      return item;
    });
  });

  const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[]>(() => {
    const saved = localStorage.getItem("ut_outfits");
    return saved ? JSON.parse(saved) : initialOutfits;
  });

  // Navigation states
  const [activeTab, setActiveTab] = useState<"home" | "scenes" | "wardrobe" | "tryon">("home");
  const [showProfile, setShowProfile] = useState(false);

  // 2. Persist state changes in LocalStorage
  useEffect(() => {
    localStorage.setItem("ut_user", JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem("ut_scenes", JSON.stringify(scenes));
  }, [scenes]);

  useEffect(() => {
    localStorage.setItem("ut_itineraries", JSON.stringify(itineraries));
  }, [itineraries]);

  useEffect(() => {
    localStorage.setItem("ut_clothing", JSON.stringify(clothingList));
  }, [clothingList]);

  useEffect(() => {
    localStorage.setItem("ut_outfits", JSON.stringify(savedOutfits));
  }, [savedOutfits]);

  // 3. Auth Actions
  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    setActiveTab("home");
    setShowProfile(false);
  };

  const handleSignOut = () => {
    setUser({
      ...user,
      isLoggedIn: false,
    });
    setShowProfile(false);
  };

  // 4. Data Modification Handlers
  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  // Scene handlers
  const handleAddScene = (newScene: Scene) => {
    setScenes([...scenes, newScene]);
  };

  const handleUpdateScene = (updatedScene: Scene) => {
    setScenes(scenes.map((s) => (s.id === updatedScene.id ? updatedScene : s)));
    // Sync temperature change to active itineraries
    setItineraries(
      itineraries.map((it) =>
        it.sceneId === updatedScene.id ? { ...it, temperature: updatedScene.temperature } : it
      )
    );
  };

  const handleDeleteScene = (id: string) => {
    setScenes(scenes.filter((s) => s.id !== id));
    // Remove related itinerary items to avoid broken references
    setItineraries(itineraries.filter((it) => it.sceneId !== id));
  };

  // Itinerary handlers
  const handleAddItinerary = (newItem: ItineraryItem) => {
    setItineraries([...itineraries, newItem]);
  };

  const handleUpdateItinerary = (updatedItem: ItineraryItem) => {
    setItineraries(itineraries.map((it) => (it.id === updatedItem.id ? updatedItem : it)));
  };

  const handleDeleteItinerary = (id: string) => {
    setItineraries(itineraries.filter((it) => it.id !== id));
  };

  // Clothing handlers
  const handleAddClothing = (newItem: Clothing) => {
    setClothingList([newItem, ...clothingList]);
  };

  const handleDeleteClothing = (id: string) => {
    // Check if the clothing is being used in any saved outfit
    const isReferenced = savedOutfits.some((outfit) =>
      outfit.canvasItems.some((ci) => ci.clothingId === id)
    );

    if (isReferenced) {
      if (
        window.confirm(
          "此衣物已被包含在您保存的‘推荐搭配组合’中。删除它会同时从那些搭配中移除。确定删除吗？"
        )
      ) {
        // Soft delete or filter out from saved outfits canvas nodes
        setSavedOutfits(
          savedOutfits.map((outfit) => ({
            ...outfit,
            canvasItems: outfit.canvasItems.filter((ci) => ci.clothingId !== id),
          }))
        );
        setClothingList(clothingList.filter((c) => c.id !== id));
      }
    } else {
      setClothingList(clothingList.filter((c) => c.id !== id));
    }
  };

  const handleUpdateClothing = (updatedItem: Clothing) => {
    setClothingList(clothingList.map((c) => (c.id === updatedItem.id ? updatedItem : c)));
  };

  // Saved Outfits handlers
  const handleSaveOutfit = (newOutfit: SavedOutfit) => {
    setSavedOutfits([newOutfit, ...savedOutfits]);
  };

  const handleDeleteOutfit = (id: string) => {
    if (window.confirm("确定要删除这套穿搭组合吗？")) {
      setSavedOutfits(savedOutfits.filter((o) => o.id !== id));
    }
  };

  // Render Login flow if session is unauthenticated
  if (!user.isLoggedIn) {
    return <WeChatLogin onLoginSuccess={handleLoginSuccess} initialUser={initialUser} />;
  }

  // Render Settings/Profile Drawer view if triggered
  if (showProfile) {
    return (
      <ProfileView
        user={user}
        onUpdateUser={handleUpdateUser}
        onBack={() => setShowProfile(false)}
        onSignOut={handleSignOut}
      />
    );
  }

  return (
    <div id="application_root" className="min-h-screen bg-[#faf9f7] relative">
      {/* 5. Main Screen Router based on activeTab */}
      <main className="w-full">
        {activeTab === "home" && (
          <HomeView
            user={user}
            scenes={scenes}
            itineraries={itineraries}
            onAddItinerary={handleAddItinerary}
            onDeleteItinerary={handleDeleteItinerary}
            onUpdateItinerary={handleUpdateItinerary}
            onOpenProfile={() => setShowProfile(true)}
            onTabChange={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === "scenes" && (
          <SceneView
            scenes={scenes}
            onAddScene={handleAddScene}
            onUpdateScene={handleUpdateScene}
            onDeleteScene={handleDeleteScene}
          />
        )}

        {activeTab === "wardrobe" && (
          <WardrobeView
            clothingList={clothingList}
            onAddClothing={handleAddClothing}
            onDeleteClothing={handleDeleteClothing}
            onUpdateClothing={handleUpdateClothing}
          />
        )}

        {activeTab === "tryon" && (
          <TryOnView
            clothingList={clothingList}
            savedOutfits={savedOutfits}
            onSaveOutfit={handleSaveOutfit}
            onDeleteOutfit={handleDeleteOutfit}
          />
        )}
      </main>

      {/* 6. High-contrast, Frosted Glass Bottom Navigation Bar */}
      <nav
        id="bottom_navigation_bar"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/70 backdrop-blur-xl border-t border-gray-100 max-w-md mx-auto shadow-2xl rounded-t-3xl"
      >
        <div className="grid grid-cols-4 py-3 text-center">
          {/* TAB 1: 首页 (Home) */}
          <button
            id="nav_tab_home"
            onClick={() => setActiveTab("home")}
            className={`flex flex-col items-center justify-center space-y-0.5 cursor-pointer transition-all ${
              activeTab === "home" ? "text-black scale-105" : "text-gray-400 hover:text-gray-700"
            }`}
          >
            <span
              className="material-symbols-outlined text-2xl"
              style={{ fontVariationSettings: activeTab === "home" ? "'FILL' 1" : "'FILL' 0" }}
            >
              wb_sunny
            </span>
            <span className="text-[10px] font-bold font-sans">首页</span>
          </button>

          {/* TAB 2: 场景库 (Scenarios) */}
          <button
            id="nav_tab_scenes"
            onClick={() => setActiveTab("scenes")}
            className={`flex flex-col items-center justify-center space-y-0.5 cursor-pointer transition-all ${
              activeTab === "scenes" ? "text-black scale-105" : "text-gray-400 hover:text-gray-700"
            }`}
          >
            <span
              className="material-symbols-outlined text-2xl"
              style={{ fontVariationSettings: activeTab === "scenes" ? "'FILL' 1" : "'FILL' 0" }}
            >
              widgets
            </span>
            <span className="text-[10px] font-bold font-sans">场景库</span>
          </button>

          {/* TAB 3: 衣橱 (Wardrobe) */}
          <button
            id="nav_tab_wardrobe"
            onClick={() => setActiveTab("wardrobe")}
            className={`flex flex-col items-center justify-center space-y-0.5 cursor-pointer transition-all ${
              activeTab === "wardrobe" ? "text-black scale-105" : "text-gray-400 hover:text-gray-700"
            }`}
          >
            <span
              className="material-symbols-outlined text-2xl"
              style={{ fontVariationSettings: activeTab === "wardrobe" ? "'FILL' 1" : "'FILL' 0" }}
            >
              styler
            </span>
            <span className="text-[10px] font-bold font-sans">衣橱</span>
          </button>

          {/* TAB 4: 试穿 (Try On / Canvas) */}
          <button
            id="nav_tab_tryon"
            onClick={() => setActiveTab("tryon")}
            className={`flex flex-col items-center justify-center space-y-0.5 cursor-pointer transition-all ${
              activeTab === "tryon" ? "text-black scale-105" : "text-gray-400 hover:text-gray-700"
            }`}
          >
            <span
              className="material-symbols-outlined text-2xl"
              style={{ fontVariationSettings: activeTab === "tryon" ? "'FILL' 1" : "'FILL' 0" }}
            >
              favorite
            </span>
            <span className="text-[10px] font-bold font-sans">试穿</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
