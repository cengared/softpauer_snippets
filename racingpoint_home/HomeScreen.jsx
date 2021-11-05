import React, { useState, useEffect } from "react";
import { parse } from "query-string";

import TeamPage from "./team/TeamPage";
import WelcomeText from "./WelcomeText";
import Flights from "./Flights";
import Hotel from "./Hotel";
import RaceSchedule from "./RaceSchedule";
import Transport from "./Transport";
import LocalInformation from "./LocalInformation";
import MedicalInformation from "./MedicalInformation";

import Logo from "../common/Logo";

import srcLogo from "../assets/spLogo.svg";

import localData from "../data/racingPointData.json";
import { getData } from "../data/api";

import styles from "./HomeScreen.module.css";

export default function HomeScreen() {
  const [data, setData] = useState(localData);
  const { name } = parse(window.location.search);

  const [{ override, view }, setState] = useState({
    override: null,
    view: "personal",
  });

  useEffect(() => {
    if (view !== "personal") {
      setState((state) => ({ ...state, view: "personal" }));
    }
  }, [override]);

  useEffect(() => {
    if (document.getElementsByClassName("scroll-content").length > 0)
      document.getElementsByClassName("scroll-content")[0].scrollTo(0, 0);

    window.scrollTo(0, 0);
  }, [view]);

  useEffect(() => {
    const runEffect = async () => {
      const response = await getData().catch((_) => {
        if(!localStorage.getItem("data")){
          localStorage.setItem("data", JSON.stringify(localData))
          return;
        }
        if (localStorage.getItem("data")["updatedAt"] > data.updatedAt)
          setData(JSON.parse(localStorage.getItem("data")));
      });
      if (response) {
        if (response.status === 200) {
          if (response.data) {
            if (
              localStorage.getItem("data") &&
              JSON.parse(localStorage.getItem("data"))["updatedAt"]
            ) {
              if (
                response.data.updatedAt >
                  JSON.parse(localStorage.getItem("data"))["updatedAt"] &&
                response.data.updatedAt > data.updatedAt
              ) {
                console.log("updating content from server...");
                localStorage.setItem("data", JSON.stringify(response.data));
                setData(response.data);
              }
            }
            if (response.data.updatedAt > data.updatedAt) {
              console.log("updating content from server...");
              localStorage.setItem("data", JSON.stringify(response.data));
              setData(response.data);
            }
          }
        } else {
          if (localStorage.getItem("data"))
            setData(JSON.parse(localStorage.getItem("data")));
        }
      }
    };
    runEffect();
    setInterval(() => runEffect(), 10000);
  }, []);

  if (!name && !override)
    return (
      <div
        style={{
          paddingTop: 150,
          color: "var(--blue)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "1.5rem", marginBottom: 20 }}>
          You are not logged in.
        </div>
        <div>Please log in...</div>
        <img
          alt=""
          src={srcLogo}
          style={{ height: 150, width: 150, marginTop: 50 }}
        />
      </div>
    );

  const firstName = (override || name || "").split("_")[0];
  const lastName = (override || name || "").split("_")[1];
  const userName = firstName[0] + " " + lastName;
  const user = ((data || {}).users || []).find(
    (user) => user.firstName === firstName && user.surname === lastName
  );
  if (!user)
    return (
      <div
        style={{
          paddingTop: 150,
          color: "var(--blue)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "1.5rem", marginBottom: 20 }}>
          No user found.
        </div>
        <div>Please request access as a race team member.</div>
        <img
          alt=""
          src={srcLogo}
          style={{ height: 150, width: 150, marginTop: 50 }}
        />
      </div>
    );

  const hotel = ((data || {}).hotels || []).find((hotel) =>
    ((hotel || {}).guests || []).some((guest) => {
      var found = false;

      (guest || {}).name.split(",").forEach((name) => {
        if (!found)
          found =
            name.trim() ===
            (user || {}).firstName.charAt(0) + " " + (user || {}).surname;
      });
      return found;
    })
  );
  const flightsArray = ((data || {}).flights || [])
    .sort((a, b) => Date.parse(a.flightDate) - Date.parse(b.flightDate))
    .filter(
      (flight) =>
        ((flight || {}).passengers || []).some(
          (passenger) => passenger.passenger === userName
        ) && Date.parse(flight.flightDate) > Date.now()
    );
  console.log(
    ((data || {}).flights || []).sort(
      (a, b) => Date.parse(a.flightDate) - Date.parse(b.flightDate)
    )
  );
  //Assumption that a person will only have two flights first being outbound and 2nd being inbound
  let outboundFlight = undefined;
  let inboundFlight = undefined;

  if (flightsArray.length === 1) {
    inboundFlight = flightsArray[0] ? flightsArray[0] : undefined;
  } else if (flightsArray.length === 2) {
    outboundFlight = flightsArray[0] ? flightsArray[0] : undefined;
    inboundFlight = flightsArray[1] ? flightsArray[1] : undefined;
  }

  const carAllocations = ((data || {}).carAllocations || []).filter(
    (allocation) => {
      const isMainDriver = ((allocation || {}).assignments || []).some(
        (assignment) => ((assignment || {}).mainDriver || "") === userName
      );
      const isPassenger = (
        (allocation || {}).assignments || []
      ).some((assignment) =>
        ((assignment || {}).passengers || []).some(
          (passenger) => passenger === userName
        )
      );
      return isMainDriver || isPassenger;
    }
  );

  const contactNumbers = ((data || {}).contactDetails || []).find((details) => {
    return ((details || {}).name || "").includes(firstName + " " + lastName);
  });

  const hotelLeaveTimes =
    (((data || {}).hotelLeaveTimes || [])[0] || {}).times || [];

  return (
    <div className={styles.root}>
      <Logo />
      {override && (
        <div
          onClick={() => setState((state) => ({ ...state, override: null }))}
          style={{
            backgroundColor: "var(--pink)",
            color: "white",
            marginTop: 20,
            padding: 10,
          }}
        >
          You're viewing information for a different team member. Click here to
          return to your personal view.
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          margin: "20px 0",
        }}
      >
        <div
          style={{
            backgroundColor: view === "personal" ? "var(--pink)" : "#9eaaba",
            color: "white",
            width: "50%",
            padding: 4,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontWeight: 700,
          }}
          onClick={() => setState((state) => ({ ...state, view: "personal" }))}
        >
          {(user || {}).firstName || "Personal"}
        </div>
        <div
          style={{
            backgroundColor: view === "team" ? "var(--pink)" : "#9eaaba",
            color: "white",
            width: "50%",
            padding: 4,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontWeight: 700,
          }}
          onClick={() => setState((state) => ({ ...state, view: "team" }))}
        >
          Team
        </div>
      </div>
      {view === "personal" ? (
        <>
          {override && (
            <div style={{ color: "var(--blue)" }}>
              {(contactNumbers || {}).telephoneOne && (
                <div>
                  {"Phone number(s): "}
                  <a
                    style={{ color: "var(--pink)" }}
                    href={"tel:" + (contactNumbers || {}).telephoneOne}
                  >
                    {(contactNumbers || {}).telephoneOne}
                  </a>
                  {(contactNumbers || {}).telephoneTwo && (
                    <span>
                      <span> or </span>
                      <a
                        style={{ color: "var(--pink)" }}
                        href={"tel:" + (contactNumbers || {}).telephoneTwo}
                      >
                        {(contactNumbers || {}).telephoneTwo}
                      </a>
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
          <WelcomeText
            username={(user || {}).firstName}
            raceName={((data || {}).generalInfo || {}).raceName}
            startDate={((data || {}).generalInfo || {}).startDate}
            endDate={((data || {}).generalInfo || {}).endDate}
          />
          <Flights
            flights={outboundFlight}
            firstName={firstName}
            lastName={lastName}
            userName={userName}
            flightType={"outbound"}
          />
          <Flights
            flights={inboundFlight}
            firstName={firstName}
            lastName={lastName}
            userName={userName}
            flightType={"inbound"}
          />
          <Transport
            userName={userName}
            carAllocations={carAllocations}
            cars={((data || {}).hireCars || {}).cars}
          />
          <Hotel hotel={hotel} leaveTimes={hotelLeaveTimes} />
          <RaceSchedule
            raceTimes={(((data || {}).raceInfo || [])[0] || {}).raceTimes}
            chassis={((data || {}).generalInfo || {}).chassis}
            garageNumbers={
              (((data || {}).raceInfo || [])[0] || {}).garageNumbers
            }
          />
          <MedicalInformation info={(data || {}).formulaMedicine} />
          <LocalInformation info={(data || {}).generalInfo} />
        </>
      ) : (
        <TeamPage
          setOverride={(username) =>
            setState((state) => ({ ...state, override: username }))
          }
          data={data}
        />
      )}
    </div>
  );
}
