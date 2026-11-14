import { Link } from '../lib/router';

export function NotFound() {
  return (
    <div className="wrap">
      <div className="not-found">
        <h1>This page isn’t in the notebook.</h1>
        <p className="lede">The link may be old, or the project may have closed. Try searching, or start from one of these.</p>
        <div className="cluster">
          <Link to="/" className="btn btn-primary">
            Home
          </Link>
          <Link to="/projects" className="btn btn-secondary">
            Projects
          </Link>
          <Link to="/learn" className="btn btn-secondary">
            Academy
          </Link>
        </div>
      </div>
    </div>
  );
}
