// TRUE NEGATIVE: React component with large JSX (should NOT be flagged)
// Expected: NO SMELL001 finding

export function MyComponent() {
  const [count, setCount] = useState(0);
  const [items, setItems] = useState([]);

  return (
    <div className="container">
      <header>
        <h1>My Application</h1>
        <nav>
          <ul>
            <li>
              <a href="/home">Home</a>
            </li>
            <li>
              <a href="/about">About</a>
            </li>
            <li>
              <a href="/contact">Contact</a>
            </li>
          </ul>
        </nav>
      </header>

      <main>
        <section>
          <h2>Welcome</h2>
          <p>This is a long component with lots of JSX markup.</p>
          <div className="content">
            <article>
              <h3>Article Title</h3>
              <p>Article content goes here...</p>
            </article>
            <article>
              <h3>Another Article</h3>
              <p>More content...</p>
            </article>
          </div>
        </section>

        <section>
          <h2>Features</h2>
          <ul>
            <li>Feature 1</li>
            <li>Feature 2</li>
            <li>Feature 3</li>
            <li>Feature 4</li>
            <li>Feature 5</li>
          </ul>
        </section>

        <section>
          <h2>Gallery</h2>
          <div className="gallery">
            <img src="image1.jpg" alt="Image 1" />
            <img src="image2.jpg" alt="Image 2" />
            <img src="image3.jpg" alt="Image 3" />
          </div>
        </section>
      </main>

      <footer>
        <p>Copyright 2024</p>
      </footer>
    </div>
  );
}
