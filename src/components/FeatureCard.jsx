export default function FeatureCard({ type, title, description, image }) {
  return (
    <div className={`feature-card${type}`}>
      <h2>{title}</h2>
      <p>{description}</p>
      <img src={`/images/${image}`} alt="" />
    </div>
  );
}