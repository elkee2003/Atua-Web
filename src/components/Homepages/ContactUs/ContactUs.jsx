import { useState } from "react";
import { useForm } from "react-hook-form";
import "./ContactUs.css";

const ContactUs = () => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);

  const contactLinks = {
    email: "mailto:support@atuainc.com",
    phone: "tel:+2347042961902",
    instagram: "https://instagram.com/atuainc",
    twitter: "https://twitter.com/atuainc",
  };

  const onSubmit = async (data) => {
    setLoading(true);

    try {
      console.log("Message sent:", data);
      alert("Message sent successfully!");
      reset();
    } catch (err) {
      alert("Failed to send message");
    }

    setLoading(false);
  };

  return (
    <section className="contactPage">
      <div className="contactWrapper">

        {/* LEFT SIDE */}
        <div className="contactLeft">
          <h1>Get in Touch</h1>
          <p>
            We’re always ready to help with deliveries, partnerships,
            or general inquiries. Expect a response within 24 hours.
          </p>

          <div className="contactInfoBox">
            <a href={contactLinks.email} className="infoItem">📧 support@atuainc.com</a>
            <a href={contactLinks.phone} className="infoItem">📞 +234 704 296 1902</a>
          </div>

          <div className="socialRow">
            <a href={contactLinks.instagram} target="_blank">Instagram</a>
            <a href={contactLinks.twitter} target="_blank">Twitter</a>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="contactRight">
          <form onSubmit={handleSubmit(onSubmit)}>

            <h2>Send Message</h2>

            {/* NAME */}
            <div className="field">
              <label>Full Name</label>
              <input
                type="text"
                placeholder="Enter your name"
                {...register("name", { required: "Name is required" })}
              />
              {errors.name && <p className="error">{errors.name.message}</p>}
            </div>

            {/* EMAIL */}
            <div className="field">
              <label>Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                {...register("email", { required: "Email is required" })}
              />
              {errors.email && <p className="error">{errors.email.message}</p>}
            </div>

            {/* MESSAGE */}
            <div className="field">
              <label>Message</label>
              <textarea
                placeholder="How can we help you?"
                rows="5"
                {...register("message", { required: "Message is required" })}
              />
              {errors.message && <p className="error">{errors.message.message}</p>}
            </div>

            {/* BUTTON */}
            <button className="contactBtn" disabled={loading}>
              {loading ? "Sending..." : "Send Message"}
            </button>

          </form>
        </div>

      </div>
    </section>
  );
};

export default ContactUs;