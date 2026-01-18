import React from "react";
import { XLg, ChevronRight } from "react-bootstrap-icons";
import logo from "../assets/img/logo/logo.png";
import { socialIcons } from "../Utlits/socilIcons";

const Drawer = ({ isSidebarActive, setIsSidebarActive }) => {
  return (
    <div className={`subside__barmenu ${isSidebarActive ? "active" : ""}`}>
      <div
        onClick={() => setIsSidebarActive(false)}
        className="remove__click d-flex justify-content-center align-items-center"
      >
        <i>
          <XLg />
        </i>
      </div>
      <div className="sub__contact__wrapper d-grid">
        <a href="http://localhost:5173/" className="side-logo">
          <img src={logo} alt="img" />
        </a>
        <p>
          Neque porro quisquam est, qui dolorem ipsum quia dolor sit
          consectetur, aliquam quaerats voluptatem. Ut enim ad minima veniam,
          exercitationem laboriosam, nisi ut aliquid ex ea autem velit esse quam
          nihil
        </p>
        <div className="sub__contact-left d-grid">
          <div className="sub__contac-item">
            <div className="content">
              <span className="address d-block"> address </span>
              <span className="textp"> Victoria Street London, </span>
            </div>
          </div>
          <div className="sub__contac-item">
            <div className="content">
              <span className="address d-block"> email </span>
              <a className="textp"> Kito Expert999@.com </a>
            </div>
          </div>
          <div className="sub__contac-item">
            <div className="content">
              <span className="address d-block"> call now </span>
              <a className="textp"> +98 4758 2154 021 </a>
            </div>
          </div>
        </div>
        <div className="sub__contact-right mb-80 position-relative">
          <ul className="social d-flex gap-3">
            {socialIcons.map(({ icon, id }) => (
              <li key={id}>
                <a>
                  <i>{icon}</i>
                </a>
              </li>
            ))}
          </ul>
        </div>
        <a
          href="http://localhost:5173/"
          className="d-flex justify-content-center fw-500 cmn--btn align-items-center gap-2"
        >
          <span>
            <i>
              <ChevronRight />
            </i>
          </span>
          <span className="get__text"> Let's Talk </span>
        </a>
      </div>
    </div>
  );
};

export default Drawer;