import React from 'react';
import { Link } from 'react-router-dom';

export const Breadcrumb = ({ items }) => {
  return (
    <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={index}>
            {isLast ? (
              <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                {item.name}
              </span>
            ) : (
              <>
                <Link
                  to={item.path}
                  style={{ color: 'var(--text2)', textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={(e) => (e.target.style.color = 'var(--text)')}
                  onMouseLeave={(e) => (e.target.style.color = 'var(--text2)')}
                >
                  {item.name}
                </Link>
                <span style={{ color: 'var(--text3)' }}>/</span>
              </>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
