import React, {useState} from "react";

export default function NavLink({ destinationName, onPageChange, currentPage }) {
    /* const [active, setActive] = useState(false); */
    const isActive = (destinationName === "Sākums" && currentPage === 'home') || (destinationName === "Spēles" && currentPage === 'games') || (destinationName === "Redaktors" && currentPage === 'editor');

     return (
    <button
      type="button"
      className={`nav-link ${isActive ? "is-active" : ""}`}
      onClick={() => {
        if (destinationName === "Sākums") {
            onPageChange('home');
        } else if (destinationName === "Spēles") {
            onPageChange('games');
        } else if (destinationName === "Redaktors") {
            onPageChange('editor');
        }
      }
        }
      aria-current={isActive ? "page" : undefined}
    >
      <span className="nav-link-label">{destinationName}</span>
      <span className="nav-link-indicator" />
    </button>
  );
}