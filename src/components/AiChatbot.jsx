// src/components/AiChatbot.jsx
import React, { useEffect } from 'react';

const AiChatbot = () => {
  useEffect(() => {
    // 1. Inject host-level CSS overrides for Botpress elements to eliminate white backgrounds
    const styleId = "bp-custom-theme-styles";
    let styleTag = document.getElementById(styleId);
    if (!styleTag) {
      styleTag = document.createElement("style");
      styleTag.id = styleId;
      styleTag.textContent = `
        /* Remove any white backgrounds on launcher & avatars */
        .bpFabContainer,
        .bpFab,
        .bpHeaderContentAvatarContainer,
        .bpHeaderContentAvatarImage,
        .bpMessageAvatarContainer,
        .bpMessageAvatarImage,
        .bpMessageListMarqueeAvatarContainer,
        .bpMessageListMarqueeAvatarImage,
        .bpMessagePreviewAvatarContainer,
        .bpMessagePreviewAvatarImage,
        [class*="AvatarContainer"],
        [class*="AvatarImage"],
        [class*="avatar"] {
          background: transparent !important;
          background-color: transparent !important;
        }

        /* FAB Launcher Button - CivicFix Midnight Glass */
        .bpFabWrapper {
          position: fixed !important;
          bottom: 24px !important;
          right: 24px !important;
          z-index: 99999 !important;
        }

        .bpFab {
          width: 68px !important;
          height: 68px !important;
          border-radius: 9999px !important;
          background: radial-gradient(circle at 35% 35%, rgba(99, 102, 241, 0.42), rgba(15, 23, 42, 0.96) 75%) !important;
          backdrop-filter: blur(14px) !important;
          -webkit-backdrop-filter: blur(14px) !important;
          border: 1.5px solid rgba(99, 102, 241, 0.5) !important;
          box-shadow: 0 0 25px rgba(99, 102, 241, 0.45), 0 10px 30px rgba(0, 0, 0, 0.75) !important;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
          cursor: pointer !important;
          overflow: visible !important;
          position: relative !important;
        }

        .bpFab:hover {
          transform: scale(1.08) translateY(-3px) !important;
          border-color: rgba(129, 140, 248, 0.85) !important;
          box-shadow: 0 0 35px rgba(99, 102, 241, 0.7), 0 16px 40px rgba(0, 0, 0, 0.85) !important;
        }

        .bpFab:active {
          transform: scale(0.95) !important;
        }

        .bpFabContainer {
          width: 100% !important;
          height: 100% !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          background: transparent !important;
          border-radius: 9999px !important;
          padding: 6px !important;
        }

        .bpFabImage {
          width: 100% !important;
          height: 100% !important;
          object-fit: contain !important;
          background: transparent !important;
          border-radius: 0 !important;
          filter: drop-shadow(0 4px 10px rgba(99, 102, 241, 0.55)) !important;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), filter 0.3s ease !important;
        }

        .bpFab:hover .bpFabImage {
          filter: drop-shadow(0 6px 16px rgba(129, 140, 248, 0.85)) !important;
          transform: scale(1.06) !important;
        }

        /* Unread Badge */
        .bpUnreadMessage {
          background: linear-gradient(135deg, #ef4444, #f43f5e) !important;
          box-shadow: 0 0 14px rgba(239, 68, 68, 0.7) !important;
          font-weight: 700 !important;
          border: 2px solid #0f172a !important;
          color: #ffffff !important;
        }
      `;
      document.head.appendChild(styleTag);
    }

    // 2. Initialize Botpress with transparent logo & Midnight Theme
    const initBotpress = () => {
      if (window.botpress && typeof window.botpress.init === 'function') {
        const origin = window.location.origin;
        window.botpress.init({
          botId: "2ecae1c1-70d1-4f64-aef3-af52d38292c3",
          clientId: "9851d42c-ce67-4ca2-ace6-c7e7d64785b5",
          configuration: {
            version: "v2",
            botName: "Civic Care Assistant",
            botAvatar: `${origin}/civic.png`,
            fabImage: `${origin}/civic.png`,
            botDescription: "24/7 AI Campus & Civic Response Assistant",
            website: {},
            email: {},
            phone: {},
            termsOfService: {},
            privacyPolicy: {},
            color: "#6366f1",
            variant: "solid",
            headerVariant: "glass",
            themeMode: "dark",
            fontFamily: "inter",
            radius: 2,
            feedbackEnabled: false,
            footer: "[⚡ CivicFix AI Assistant](https://civic-fix-ai.vercel.app/)",
            soundEnabled: false,
            proactiveMessageEnabled: false,
            proactiveBubbleMessage: "Hi! 👋 How can Civic Care help you today?",
            proactiveBubbleTriggerType: "afterDelay",
            proactiveBubbleDelayTime: 10,
            additionalStylesheetUrl: `${origin}/botpress.css`
          }
        });
      }
    };

    // 3. Load Botpress Core Library if not already loaded
    let script = document.getElementById("bp-inject-script");
    if (!script) {
      script = document.createElement("script");
      script.src = "https://cdn.botpress.cloud/webchat/v3.5/inject.js";
      script.async = true;
      script.id = "bp-inject-script";
      script.onload = () => {
        initBotpress();
      };
      document.body.appendChild(script);
    } else {
      initBotpress();
    }

    return () => {
      // Keep Botpress widget mounted and persistent across views and role switches
    };
  }, []);

  return <div id="webchat" />;
};

export default AiChatbot;
