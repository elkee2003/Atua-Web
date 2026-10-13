const TimelineItem = ({ label, value }) => {
  return (
    <div className="timelineItem">
      <div className="timelineDot" />
      <div>
        <p className="timelineLabel">{label}</p>
        <p className="timelineTime">
          {value
            ? new Date(value).toLocaleString([], {
                year: "numeric",
                month: "short",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "-"}
        </p>
      </div>
    </div>
  );
};
