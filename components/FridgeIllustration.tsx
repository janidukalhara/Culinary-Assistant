import React from "react";

/** Decorative illustration only; labels below are examples, never inference results. */
export default function FridgeIllustration() {
  return (
    <div className="fridge-scene" aria-hidden="true">
      <div className="scene-orbit orbit-one" />
      <div className="scene-orbit orbit-two" />
      <span className="scene-spark spark-one">✳</span>
      <span className="scene-spark spark-two">✧</span>
      <svg className="fridge-art" viewBox="0 0 480 430" fill="none">
        <defs>
          <linearGradient
            id="fridgeBody"
            x1="120"
            y1="60"
            x2="350"
            y2="410"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#fffef3" />
            <stop offset="1" stopColor="#dbe5c7" />
          </linearGradient>
          <linearGradient
            id="fridgeInside"
            x1="160"
            y1="70"
            x2="320"
            y2="370"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#c1d0b0" />
            <stop offset="1" stopColor="#eaf0df" />
          </linearGradient>
        </defs>
        <ellipse
          cx="244"
          cy="399"
          rx="144"
          ry="16"
          fill="#294d32"
          opacity=".09"
        />
        <path
          d="M150 379v20m171-20v20"
          stroke="#456149"
          strokeWidth="13"
          strokeLinecap="round"
        />
        <rect
          x="121"
          y="34"
          width="232"
          height="357"
          rx="29"
          fill="url(#fridgeBody)"
          stroke="#a8bb97"
          strokeWidth="2"
        />
        <rect
          x="139"
          y="52"
          width="196"
          height="320"
          rx="18"
          fill="url(#fridgeInside)"
          stroke="#abbf9e"
        />
        <rect x="151" y="63" width="171" height="304" rx="12" fill="#f9fbf0" />
        <rect x="214" y="63" width="44" height="6" rx="3" fill="#f4da83" />
        <path d="M151 159h171M151 252h171" stroke="#a8bb97" strokeWidth="7" />
        <path d="M151 155h171M151 248h171" stroke="#e4edce" strokeWidth="4" />
        <g className="produce-float">
          <path
            d="m174 92 13-13h23l13 13v60h-49Z"
            fill="#fff"
            stroke="#b4c1b1"
          />
          <path d="M174 93h49v18h-49Z" fill="#89abc0" />
          <path d="m187 79 7 14h29" stroke="#b4c1b1" />
          <path
            d="M187 123h22m-19 6h16"
            stroke="#668b9f"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <rect x="194" y="73" width="12" height="6" rx="2" fill="#89abc0" />
          <path d="M257 103h40l7 44h-54Z" fill="#e9d690" />
          <path
            d="M256 104c-10-9 2-22 11-14 1-13 17-15 20-1 14-6 19 13 8 15"
            fill="#7f9f5b"
          />
          <path d="m269 124 8-29 8 29" stroke="#557949" strokeWidth="3" />
        </g>
        <g>
          <ellipse cx="190" cy="218" rx="23" ry="25" fill="#df7454" />
          <path d="m190 192-9-6 7 1 3-7 3 9 8-1-7 5" fill="#527747" />
          <ellipse cx="237" cy="221" rx="22" ry="22" fill="#e49a5b" />
          <path d="m237 200 1-8" stroke="#526c3d" strokeWidth="4" />
          <path d="M238 195q17-13 19 0-11 6-19 0" fill="#6a9051" />
          <path d="m274 195 28 8-21 39Z" fill="#e59c4e" />
          <path
            d="m277 198-1-18m11 19 9-20m-13 18 3-21"
            stroke="#638d4f"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </g>
        <rect
          x="159"
          y="267"
          width="155"
          height="85"
          rx="10"
          fill="#dfe9cc"
          stroke="#afc19b"
        />
        <path
          d="M168 295c-16-14 1-33 14-20 2-19 24-23 28-3 18-10 29 7 16 23"
          fill="#638b53"
        />
        <path
          d="M186 303v-23m0 12-10-8m10 4 13-8"
          stroke="#b4cd88"
          strokeWidth="3"
        />
        <ellipse cx="251" cy="285" rx="11" ry="15" fill="#e3c8a0" />
        <ellipse cx="278" cy="287" rx="11" ry="15" fill="#f3dfbb" />
        <ellipse cx="265" cy="305" rx="11" ry="15" fill="#ead1ae" />
        <path
          d="M162 312h149v30a8 8 0 0 1-8 8H170a8 8 0 0 1-8-8Z"
          fill="#d5e1bb"
          fillOpacity=".85"
        />
        <path
          d="M215 327h44"
          stroke="#97ad80"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M134 65 66 97v268l68 17V65Z"
          fill="#f2f4e5"
          stroke="#b2c29e"
          strokeWidth="2"
        />
        <path d="m81 129 40-14v61l-40 9Z" fill="#d8e1c6" />
        <path d="m81 225 40-6v65l-40-1Z" fill="#d8e1c6" />
        <path d="m78 188 43-9m-43 107 43 1" stroke="#aabd96" strokeWidth="5" />
        <path
          d="M73 211v39"
          stroke="#91a782"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <g stroke="#3d815a" strokeWidth="1.5" strokeDasharray="5 4">
          <rect x="165" y="72" width="65" height="82" rx="6" />
          <rect x="163" y="184" width="54" height="61" rx="6" />
          <rect x="164" y="263" width="64" height="47" rx="6" />
        </g>
      </svg>
      <div className="ingredient-note note-one">
        <span className="note-dot" />
        Fresh possibilities<span className="note-icon">✦</span>
      </div>
      <div className="ingredient-note note-two">
        <span className="tiny-leaf">↗</span>Less waste.
        <br />
        <strong>More delicious.</strong>
      </div>
      <div className="scene-caption">
        A little fridge inspiration. A lot of possibility.
      </div>
    </div>
  );
}
