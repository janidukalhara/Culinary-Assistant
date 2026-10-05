import React, { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import FridgeIllustration from "./FridgeIllustration";

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  isLoading: boolean;
  loadingStage: "detecting" | "recipes";
  error: string | null;
}

export default function ImageUploader({
  onImageUpload,
  isLoading,
  loadingStage,
  error,
}: ImageUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const selectFile = (next: File) => {
    if (isLoading) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(next.type)) {
      setValidationError("Please choose a JPG, PNG, or WebP photo.");
      return;
    }
    if (!next.size || next.size > 10 * 1024 * 1024) {
      setValidationError("Choose a photo under 10 MB that is not empty.");
      return;
    }
    setValidationError(null);
    setFile(next);
  };

  return (
    <>
      <section className="hero reveal">
        <div className="hero-copy">
          <span className="eyebrow">
            <span className="status-dot" /> YOUR INGREDIENTS. ENDLESS
            POSSIBILITIES.
          </span>
          <h1>
            Good food starts
            <br />
            with <em>what you have.</em>
          </h1>
          <p>
            That half-full fridge? It’s full of ideas. Snap a photo, discover
            what you can make, and turn everyday ingredients into something
            delicious.
          </p>
          <div className="hero-actions">
            <a href="#upload" className="primary-button">
              Let’s get cooking <Icon name="arrow" />
            </a>
            <a href="#how-it-works" className="text-link">
              How it works <span>↗</span>
            </a>
          </div>
          <div className="hero-perks">
            <span>
              <Icon name="leaf" /> Make more. Waste less.
            </span>
            <span>
              <Icon name="sparkles" /> A little help from AI.
            </span>
          </div>
        </div>
        <FridgeIllustration />
      </section>

      <section id="upload" className="upload-section reveal delay-one">
        <div className="section-heading">
          <div>
            <span className="eyebrow">FROM FRIDGE TO FORK</span>
            <h2>What’s in your fridge?</h2>
          </div>
          <span className="step-pill">
            STEP 01 <span>/ 03</span>
          </span>
        </div>
        <div className="upload-layout">
          <div
            className={`upload-card ${dragging ? "is-dragging" : ""}`}
            aria-busy={isLoading}
            onDragEnter={(e) => {
              e.preventDefault();
              dragDepth.current++;
              if (!isLoading) setDragging(true);
            }}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={(e) => {
              e.preventDefault();
              if (--dragDepth.current <= 0) {
                dragDepth.current = 0;
                setDragging(false);
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              dragDepth.current = 0;
              setDragging(false);
              if (e.dataTransfer.files[0]) selectFile(e.dataTransfer.files[0]);
            }}
          >
            <input
              ref={input}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              aria-label="Choose a fridge photo"
              disabled={isLoading}
              onChange={(e) => {
                if (e.target.files?.[0]) selectFile(e.target.files[0]);
                e.target.value = "";
              }}
            />
            {isLoading ? (
              <div className="scan-progress" role="status" aria-live="polite">
                <div className="scan-preview">
                  {preview && (
                    <img src={preview} alt="Your selected fridge photo" />
                  )}
                  <div className="scan-line" />
                  <Icon name="scan" />
                </div>
                <span className="eyebrow">A LITTLE KITCHEN MAGIC</span>
                <h3>
                  {loadingStage === "detecting"
                    ? "Finding your ingredients…"
                    : "Finding delicious possibilities…"}
                </h3>
                <p>
                  {loadingStage === "detecting"
                    ? "Looking closely at your photo. The first scan may take a little longer."
                    : "Your ingredients are ready. We’re creating recipe ideas for you."}
                </p>
                <div className="progress-stages">
                  <span
                    className={
                      loadingStage === "detecting" ? "current" : "complete"
                    }
                  >
                    01 · Identify
                  </span>
                  <span className={loadingStage === "recipes" ? "current" : ""}>
                    02 · Create recipes
                  </span>
                  <span>03 · Cook</span>
                </div>
              </div>
            ) : (
              <>
                {preview ? (
                  <div className="selected-photo">
                    <img src={preview} alt="Selected fridge photo" />
                    <button
                      className="icon-button"
                      aria-label="Remove selected photo"
                      onClick={() => {
                        setFile(null);
                        setValidationError(null);
                      }}
                    >
                      <Icon name="close" />
                    </button>
                    <span>{file?.name}</span>
                  </div>
                ) : (
                  <div className="upload-symbol">
                    <Icon name="upload" />
                    <span>+</span>
                  </div>
                )}
                <h3>
                  {dragging
                    ? "Drop something delicious here"
                    : file
                      ? "Looking fresh. Ready to scan?"
                      : "Your next meal is one photo away"}
                </h3>
                <p>
                  {file
                    ? "We’ll identify your ingredients and find recipes to match."
                    : "Drag & drop a fridge photo here, or choose one below."}
                </p>
                <div className="upload-actions">
                  <button
                    className={file ? "secondary-button" : "primary-button"}
                    onClick={() => input.current?.click()}
                  >
                    <Icon name="upload" />
                    {file ? "Change photo" : "Choose a photo"}
                  </button>
                  {file && (
                    <button
                      className="primary-button"
                      onClick={() => onImageUpload(file)}
                    >
                      Find my recipes <Icon name="sparkles" />
                    </button>
                  )}
                </div>
                <span className="upload-formats">
                  JPG, PNG or WebP · Up to 10 MB
                </span>
              </>
            )}
            {(validationError || error) && (
              <div className="error-notice" role="alert">
                {validationError || error}
              </div>
            )}
          </div>
          <aside className="photo-tips">
            <span className="tips-icon">
              <Icon name="leaf" />
            </span>
            <h3>
              A good photo.
              <br />A great starting point.
            </h3>
            <p>A few little tips for a better scan.</p>
            <ul>
              <li>
                <span>01</span>Let there be light. Open the door and keep things
                bright.
              </li>
              <li>
                <span>02</span>Give ingredients their moment. Keep labels and
                items visible.
              </li>
              <li>
                <span>03</span>Keep it sharp. A clear, steady photo makes all
                the difference.
              </li>
            </ul>
            <div className="tips-footnote">
              <Icon name="sparkles" />
              Always check detected ingredients before cooking.
            </div>
          </aside>
        </div>
      </section>

      <section id="how-it-works" className="how-section reveal delay-two">
        <div className="section-heading">
          <div>
            <span className="eyebrow">LESS GUESSWORK. MORE GOOD FOOD.</span>
            <h2>A little inspiration, in three steps.</h2>
          </div>
          <span className="handwritten">Simple as that ↴</span>
        </div>
        <div className="how-grid">
          {[
            {
              icon: "scan" as const,
              title: "Snap your fridge",
              text: "Upload a clear photo of the ingredients you already have.",
            },
            {
              icon: "sparkles" as const,
              title: "Find your inspiration",
              text: "Discover ingredients and recipe ideas made around them.",
            },
            {
              icon: "chef" as const,
              title: "Make something good",
              text: "Follow the steps, save your favourites, and enjoy every bite.",
            },
          ].map((item, index) => (
            <article key={item.title} className="how-card">
              <div>
                <span className="how-icon">
                  <Icon name={item.icon} />
                </span>
                <span className="how-number">0{index + 1}</span>
              </div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
