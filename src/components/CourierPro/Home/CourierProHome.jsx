import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CourierProHome.css";

const CourierProHome = () => {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  const features = [
    {
      number: "01",
      title: "Rider Management",
      description:
        "Manage your riders, organise your team, monitor their activity and keep your fleet operations organised.",
      icon: "riders",
    },
    {
      number: "02",
      title: "Vehicle Management",
      description:
        "Register your fleet vehicles, assign vehicles to riders and maintain visibility over your fleet.",
      icon: "vehicles",
    },
    {
      number: "03",
      title: "Live Fleet Tracking",
      description:
        "See where your active riders are and gain better visibility into your fleet's daily operations.",
      icon: "tracking",
    },
    {
      number: "04",
      title: "Delivery Management",
      description:
        "Manage delivery operations and monitor orders handled by your fleet from one central platform.",
      icon: "deliveries",
    },
    {
      number: "05",
      title: "Fleet Performance",
      description:
        "Get a clearer picture of your fleet's operations and make better decisions as your business grows.",
      icon: "performance",
    },
    {
      number: "06",
      title: "Business Control",
      description:
        "Manage your fleet organisation, team access and operational settings from a single workspace.",
      icon: "business",
    },
  ];

  const plans = [
    {
      name: "Free",
      price: "₦0",
      description: "Get started with the essentials.",
      features: [
        "Fleet management",
        "Up to 3 riders",
        "Up to 3 vehicles",
        "Live fleet tracking",
        "Basic fleet operations",
      ],
      featured: false,
    },
    {
      name: "Starter",
      price: "₦7,500",
      description: "For growing small fleet operations.",
      features: [
        "Everything in Free",
        "Up to 10 riders",
        "Up to 10 vehicles",
        "Expanded fleet management",
        "More operational capacity",
      ],
      featured: false,
    },
    {
      name: "Growth",
      price: "₦20,000",
      description: "For businesses scaling their operations.",
      features: [
        "Everything in Starter",
        "Up to 25 riders",
        "Up to 25 vehicles",
        "Advanced fleet operations",
        "Private delivery capabilities",
      ],
      featured: true,
    },
    {
      name: "Business",
      price: "₦50,000",
      description: "For established fleet businesses.",
      features: [
        "Everything in Growth",
        "Up to 75 riders",
        "Up to 75 vehicles",
        "Expanded business operations",
        "More room to scale",
      ],
      featured: false,
    },
  ];

  const scrollToSection = (sectionId) => {
    closeMenu();

    document.getElementById(sectionId)?.scrollIntoView({
      behavior: "smooth",
    });
  };

  return (
    <main className="courierProHome">
      {/* =========================
          NAVIGATION
      ========================== */}
      <header className="cpHeader">
        <div className="cpHeaderInner">
          <a href="#home" className="cpBrand" onClick={closeMenu}>
            <span className="cpBrandIcon">A</span>

            <span className="cpBrandText">
              <strong>ATUA</strong>
              <small>COURIER PRO</small>
            </span>
          </a>

          <button
            type="button"
            className="cpMobileMenuButton"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={menuOpen}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          <nav className={`cpNavigation ${menuOpen ? "cpNavigationOpen" : ""}`}>
            <a href="#features" onClick={closeMenu}>
              Features
            </a>

            <a href="#how-it-works" onClick={closeMenu}>
              How It Works
            </a>

            <a href="#plans" onClick={closeMenu}>
              Pricing
            </a>

            <a href="#about" onClick={closeMenu}>
              About
            </a>

            <div className="cpNavMobileActions">
              <button
                type="button"
                className="cpButton cpButtonOutline"
                onClick={() => {
                  closeMenu();
                  navigate("/courier-pro/login");
                }}
              >
                Sign In
              </button>

              <button
                type="button"
                className="cpButton cpButtonPrimary"
                onClick={() => {
                  closeMenu();
                  navigate("/courier-pro/signup");
                }}
              >
                Get Started
              </button>
            </div>
          </nav>

          <div className="cpHeaderActions">
            <button
              type="button"
              className="cpButton cpButtonOutline"
              onClick={() => navigate("/courier-pro/login")}
            >
              Sign In
            </button>

            <button
              type="button"
              className="cpButton cpButtonPrimary"
              onClick={() => navigate("/courier-pro/signup")}
            >
              Get Started
              <span>↗</span>
            </button>
          </div>
        </div>
      </header>

      {/* =========================
          HERO
      ========================== */}
      <section className="cpHero" id="home">
        <div className="cpHeroBackground"></div>

        <div className="cpContainer cpHeroInner">
          <div className="cpHeroContent">
            <div className="cpEyebrow">
              <span className="cpEyebrowDot"></span>
              FLEET MANAGEMENT, SIMPLIFIED
            </div>

            <h1>
              Your fleet.
              <br />
              Your business.
              <br />
              <span>One platform.</span>
            </h1>

            <p className="cpHeroDescription">
              Take control of your delivery operations with Atua Courier Pro.
              Manage your riders, vehicles and deliveries from one powerful
              fleet management platform.
            </p>

            <div className="cpHeroActions">
              <button
                type="button"
                className="cpButton cpButtonPrimary cpHeroButton"
                onClick={() => navigate("/courier-pro/signup")}
              >
                Get Started
                <span>↗</span>
              </button>

              <button
                type="button"
                className="cpButton cpButtonOutline cpHeroButton"
                onClick={() => scrollToSection("features")}
              >
                Explore Features
                <span>↓</span>
              </button>
            </div>

            <div className="cpHeroTrust">
              <span className="cpTrustCheck">✓</span>
              Built for modern delivery businesses
            </div>
          </div>

          {/* Dashboard preview illustration */}
          <div className="cpHeroVisual">
            <div className="cpDashboardWindow">
              <div className="cpDashboardTopbar">
                <div className="cpDashboardBrand">
                  <span className="cpDashboardLogo">A</span>
                  <strong>Atua Courier Pro</strong>
                </div>

                <div className="cpDashboardAvatar">F</div>
              </div>

              <div className="cpDashboardBody">
                <div className="cpDashboardWelcome">
                  <div>
                    <small>FLEET OVERVIEW</small>
                    <h3>Your operations</h3>
                  </div>

                  <span className="cpDashboardPeriod">Today</span>
                </div>

                <div className="cpDashboardStats">
                  <div className="cpDashboardStat">
                    <span>Riders</span>
                    <strong>12</strong>
                    <small>Fleet members</small>
                  </div>

                  <div className="cpDashboardStat">
                    <span>Vehicles</span>
                    <strong>08</strong>
                    <small>Registered</small>
                  </div>

                  <div className="cpDashboardStat">
                    <span>Deliveries</span>
                    <strong>24</strong>
                    <small>Illustrative data</small>
                  </div>
                </div>

                <div className="cpDashboardMap">
                  <div className="cpMapLabel">
                    <span className="cpLiveDot"></span>
                    LIVE FLEET OVERVIEW
                  </div>

                  <div className="cpMapRoad cpMapRoadOne"></div>
                  <div className="cpMapRoad cpMapRoadTwo"></div>
                  <div className="cpMapRoad cpMapRoadThree"></div>

                  <div className="cpMapPin cpMapPinOne">1</div>
                  <div className="cpMapPin cpMapPinTwo">2</div>
                  <div className="cpMapPin cpMapPinThree">3</div>

                  <div className="cpMapLocation">Fleet locations</div>
                </div>

                <div className="cpDashboardBottom">
                  <div>
                    <span className="cpDashboardBottomIcon">✓</span>
                    <div>
                      <strong>Fleet workspace</strong>
                      <small>Manage your operations</small>
                    </div>
                  </div>

                  <span className="cpDashboardOnline">Active</span>
                </div>
              </div>
            </div>

            <div className="cpFloatingCard cpFloatingCardOne">
              <span className="cpFloatingIcon">↗</span>
              <div>
                <strong>One platform</strong>
                <small>Your fleet, organised</small>
              </div>
            </div>

            <div className="cpFloatingCard cpFloatingCardTwo">
              <span className="cpFloatingIcon">✓</span>
              <div>
                <strong>Stay in control</strong>
                <small>Manage your team</small>
              </div>
            </div>
          </div>
        </div>

        <div className="cpHeroBottom">
          <span>BUILT FOR FLEET OWNERS</span>
          <span className="cpHeroBottomLine"></span>
          <span>POWERED BY ATUA</span>
        </div>
      </section>

      {/* =========================
          INTRODUCTION
      ========================== */}
      <section className="cpIntro" id="about">
        <div className="cpContainer cpIntroInner">
          <div className="cpSectionEyebrow">INTRODUCING ATUA COURIER PRO</div>

          <h2>
            Running a fleet shouldn't
            <br className="cpDesktopBreak" />
            mean running around.
          </h2>

          <p>
            Whether you're managing a few delivery riders or operating a growing
            fleet business, you need the right tools to keep everything
            connected. Atua Courier Pro brings your fleet operations together in
            one place.
          </p>
        </div>
      </section>

      {/* =========================
          FEATURES
      ========================== */}
      <section className="cpFeatures" id="features">
        <div className="cpContainer">
          <div className="cpSectionHeader">
            <div>
              <div className="cpSectionEyebrow">EVERYTHING IN ONE PLACE</div>

              <h2>
                Built to manage
                <br />
                your entire fleet.
              </h2>
            </div>

            <p>
              The tools you need to organise your people, vehicles and delivery
              operations as your business grows.
            </p>
          </div>

          <div className="cpFeatureGrid">
            {features.map((feature) => (
              <article className="cpFeatureCard" key={feature.number}>
                <div className="cpFeatureTop">
                  <span className="cpFeatureNumber">{feature.number}</span>

                  <span className="cpFeatureArrow">↗</span>
                </div>

                <div className="cpFeatureIcon">
                  {feature.icon === "riders" && "♙"}
                  {feature.icon === "vehicles" && "▰"}
                  {feature.icon === "tracking" && "◎"}
                  {feature.icon === "deliveries" && "⇢"}
                  {feature.icon === "performance" && "↗"}
                  {feature.icon === "business" && "▦"}
                </div>

                <h3>{feature.title}</h3>

                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* =========================
          HOW IT WORKS
      ========================== */}
      <section className="cpHowItWorks" id="how-it-works">
        <div className="cpContainer">
          <div className="cpHowHeader">
            <div className="cpSectionEyebrow">GET STARTED WITH CONFIDENCE</div>

            <h2>
              Your fleet journey,
              <br />
              made simpler.
            </h2>

            <p>
              Get your fleet organised and start managing your delivery
              operations in a few straightforward steps.
            </p>
          </div>

          <div className="cpStepsGrid">
            <div className="cpStep">
              <span className="cpStepNumber">01</span>
              <div className="cpStepLine"></div>
              <h3>Create your fleet</h3>
              <p>Register your business and create your fleet workspace.</p>
            </div>

            <div className="cpStep">
              <span className="cpStepNumber">02</span>
              <div className="cpStepLine"></div>
              <h3>Build your team</h3>
              <p>Invite riders, register vehicles and organise your fleet.</p>
            </div>

            <div className="cpStep">
              <span className="cpStepNumber">03</span>
              <div className="cpStepLine"></div>
              <h3>Manage operations</h3>
              <p>Monitor your fleet and manage your delivery activities.</p>
            </div>

            <div className="cpStep">
              <span className="cpStepNumber">04</span>
              <div className="cpStepLine"></div>
              <h3>Grow your business</h3>
              <p>Expand your team and choose a plan that suits your needs.</p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================
          PRICING
      ========================== */}
      <section className="cpPricing" id="plans">
        <div className="cpContainer">
          <div className="cpPricingHeader">
            <div className="cpSectionEyebrow">SIMPLE, TRANSPARENT PRICING</div>

            <h2>
              A plan for every
              <br />
              stage of your fleet.
            </h2>

            <p>
              Start with what you need today. Upgrade as your fleet and business
              grow.
            </p>

            <span className="cpBillingLabel">MONTHLY SUBSCRIPTIONS</span>
          </div>

          <div className="cpPricingGrid">
            {plans.map((plan) => (
              <article
                className={`cpPlanCard ${plan.featured ? "cpPlanFeatured" : ""}`}
                key={plan.name}
              >
                {plan.featured && (
                  <div className="cpPopularLabel">RECOMMENDED</div>
                )}

                <div className="cpPlanName">{plan.name}</div>

                <div className="cpPlanPrice">
                  {plan.price}
                  <span>/month</span>
                </div>

                <p className="cpPlanDescription">{plan.description}</p>

                <div className="cpPlanDivider"></div>

                <div className="cpPlanFeatures">
                  {plan.features.map((item, index) => (
                    <div className="cpPlanFeature" key={index}>
                      <span>✓</span>
                      {item}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className={`cpButton cpPlanButton ${
                    plan.featured ? "cpButtonPrimary" : "cpButtonDark"
                  }`}
                  onClick={() => navigate("/courier-pro/signup")}
                >
                  Get Started
                  <span>↗</span>
                </button>
              </article>
            ))}
          </div>

          <p className="cpPricingNote">
            Need a larger fleet or a tailored arrangement? Contact our team to
            discuss your requirements.
          </p>
        </div>
      </section>

      {/* =========================
          FINAL CTA
      ========================== */}
      <section className="cpFinalCta" id="get-started">
        <div className="cpContainer cpFinalCtaInner">
          <div className="cpFinalCtaContent">
            <div className="cpSectionEyebrow">
              TAKE CONTROL OF YOUR OPERATIONS
            </div>

            <h2>
              It's time to manage
              <br />
              your fleet differently.
            </h2>

            <p>
              Bring your riders, vehicles and delivery operations together with
              Atua Courier Pro.
            </p>

            <button
              type="button"
              className="cpButton cpButtonPrimary cpFinalButton"
              onClick={() => navigate("/courier-pro/signup")}
            >
              Create Your Fleet
              <span>↗</span>
            </button>
          </div>

          <div className="cpCtaDecoration">
            <div className="cpCtaCircle cpCtaCircleOne"></div>
            <div className="cpCtaCircle cpCtaCircleTwo"></div>
            <div className="cpCtaLetter">A</div>
          </div>
        </div>
      </section>

      {/* =========================
          FOOTER
      ========================== */}
      <footer className="cpFooter">
        <div className="cpContainer">
          <div className="cpFooterMain">
            <div className="cpFooterBrand">
              <a href="#home" className="cpBrand">
                <span className="cpBrandIcon">A</span>

                <span className="cpBrandText">
                  <strong>ATUA</strong>
                  <small>COURIER PRO</small>
                </span>
              </a>

              <p>
                A smarter way to manage your fleet, your riders and your
                delivery operations.
              </p>
            </div>

            <div className="cpFooterLinks">
              <div>
                <h4>Platform</h4>
                <a href="#features">Features</a>
                <a href="#how-it-works">How It Works</a>
                <a href="#plans">Pricing</a>
              </div>

              <div>
                <h4>Explore</h4>
                <a href="#about">About Atua Pro</a>
                <a href="#get-started">Get Started</a>
                <a href="#home">Back to Top</a>
              </div>
            </div>
          </div>

          <div className="cpFooterBottom">
            <span>© {new Date().getFullYear()} Atua. All rights reserved.</span>
            <span>ATUA COURIER PRO</span>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default CourierProHome;
