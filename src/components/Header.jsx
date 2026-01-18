import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { HashLink } from "react-router-hash-link";
import { List, ArrowRight } from "react-bootstrap-icons";

import Drawer from "./Drawer";
import logo from "../assets/img/logo/logo1.png";

const menuList = [
  {
    id: 1,
    path: "/",
    name: "Início",
  },
  {
    id: 2,
    path: "/",
    section: "#about",
    name: "Sobre",
  },
  {
    id: 4,
    path: "/",
    section: "#services",
    name: "Inteligência Artificial",
    dropDown: [
      {
        id: 1,
        path: "/all-services",
        name: "Pacotes",
      },
      {
        id: 2,
        path: "/service-details",
        name: "Agentes",
      },
    ],
  },
  {
    id: 7,
    path: "/contact",
    name: "Contato",
  },
];

const Header = () => {
  const [isSidebarActive, setIsSidebarActive] = useState(false);
  const [menuActive, setMenuActive] = useState(false);
  const [dropDownId, setDropDownId] = useState(null);

  useEffect(() => {
    window.addEventListener("scroll", isSticky);
    return () => {
      window.removeEventListener("scroll", isSticky);
    };
  }, []);

  const isSticky = (e) => {
    const header = document.querySelector(".header-section");
    const scrollTop = window.scrollY;

    scrollTop >= 35
      ? header.classList.add("menu-fixed", "animated", "fadeInDown")
      : header.classList.remove("menu-fixed");
  };

  const handleHeaderToggle = () => {
    setMenuActive(!menuActive);
  };

  const handleSubMenu = (id) => {
    setDropDownId(id);
  };

  return (
    <header className={`header-section `}>
      <div className="container">
        <div className="header-wrapper">
          <div className="main__logo">
            <a href="http://localhost:5173/" className="logo">
              <img src={logo} alt="logo" />
            </a>
          </div>
          <ul className={`main-menu ${menuActive ? "active" : ""}`}>
            {menuList.map(({ id, name, path, dropDown, section }) => {
              return (
                <li key={id} onClick={() => handleSubMenu(id)}>
                  <a href={`http://localhost:5173/${path}${section ? section : ""}`}>
                    {name}
                  </a>
                  {dropDown?.length && (
                    <ul className={`sub-menu ${dropDownId === id ? "sub-menu_active":""}`}>
                      {dropDown.map(({ id, name, path }) => {
                        return (
                          <li key={id}>
                            <a href={`http://localhost:5173/${path}`}>
                              {name}
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
          <div className="menu__components d-flex align-items-center">
            <button
              onClick={() => window.location.href = 'http://localhost:5173/login'}
              className="d-flex fw-500 cmn--btn align-items-center gap-2"
            >
              <span className="get__text">Sair</span>
              <span>
                <ArrowRight className="fz-20" />
              </span>
            </button>
            <div
              onClick={handleHeaderToggle}
              className={`header-bar d-lg-none ${menuActive ? "active" : ""}`}
            >
              <span></span>
              <span></span>
              <span></span>
            </div>

          </div>
        </div>
      </div>
      <Drawer
        isSidebarActive={isSidebarActive}
        setIsSidebarActive={setIsSidebarActive}
      />
    </header>
  );
};

export default Header;