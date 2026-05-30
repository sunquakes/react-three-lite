// @ts-ignore
import Link from '@docusaurus/Link';
// @ts-ignore
import IndexAnimation from '@site/src/components/IndexAnimation';

interface HomeContentProps {
  badge: string;
  title: string;
  description: string;
  getStarted: string;
  github: string;
  featuresTitle: string;
  featuresDescription: string;
  quickStartTitle: string;
  quickStartDescription: string;
  readDocs: string;
  stats: Array<{ label: string; value: string }>;
  contributorsTitle: string;
  contributorsDescription: string;
  features: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
}

export default function HomeContent({
  badge,
  title,
  description,
  getStarted,
  github,
  featuresTitle,
  featuresDescription,
  quickStartTitle,
  quickStartDescription,
  readDocs,
  stats,
  contributorsTitle,
  contributorsDescription,
  features
}: HomeContentProps): JSX.Element {
  return (
    <div style={{ marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)', overflowX: 'hidden', marginTop: '-2rem' }}>
      {/* Hero Section */}
      <header style={{
        background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
        color: '#fff',
        padding: '2rem 2rem 6rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        width: '100vw',
        marginLeft: 'calc(-50vw + 50%)',
        marginRight: 'calc(-50vw + 50%)',
      }}>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '900px', margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(255, 255, 255, 0.2)',
            padding: '0.5rem 1rem',
            borderRadius: '50px',
            marginBottom: '2rem',
            fontSize: '0.9rem',
            color: '#fff'
          }}>
            <span style={{ 
              background: '#10b981', 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%',
              display: 'inline-block'
            }} />
            {badge}
          </div>

          <h1 style={{
            fontSize: '4.5rem',
            fontWeight: 800,
            color: '#ffffff',
            marginBottom: '1.5rem',
            letterSpacing: '-3px',
            lineHeight: 1.1,
            textShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
          }}>
            {title}
          </h1>
          <p style={{
            fontSize: '1.5rem',
            color: 'rgba(255, 255, 255, 0.95)',
            marginBottom: '3rem',
            lineHeight: 1.6
          }}>
            {description}
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              to="/guide/getting-started"
              style={{
                background: '#ffffff',
                color: '#3b82f6',
                padding: '1.1rem 2.5rem',
                borderRadius: '16px',
                textDecoration: 'none',
                fontWeight: 600,
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
              }}
            >
              {getStarted}
            </Link>
            <a
              href="https://github.com/sunquakes/react-three-lite"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                color: '#fff',
                padding: '1.1rem 2.5rem',
                borderRadius: '16px',
                textDecoration: 'none',
                fontWeight: 600,
                transition: 'all 0.3s ease',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {github}
            </a>
          </div>
        </div>
      </header>

      <main style={{ padding: '4rem 1rem' }}>
        {/* 3D Animation Demo */}
        <section style={{ marginBottom: '4rem' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '2rem',
            maxWidth: '1200px',
            margin: '0 auto'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <IndexAnimation />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{
                background: '#1e293b',
                padding: '1.5rem',
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1rem'
                }}>
                  <span style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: '#ef4444'
                  }} />
                  <span style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: '#f59e0b'
                  }} />
                  <span style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: '#10b981'
                  }} />
                </div>
                <pre style={{
                  margin: 0,
                  padding: 0,
                  fontSize: '0.9rem',
                  color: '#e2e8f0',
                  fontFamily: 'Monaco, Menlo, monospace',
                  overflowX: 'auto',
                  background: '#1e293b'
                }}>
                  <code>{`pnpm install react-three-lite three`}</code>
                </pre>
              </div>
              <div style={{
                background: '#1e293b',
                padding: '1.5rem',
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1rem'
                }}>
                  <span style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: '#ef4444'
                  }} />
                  <span style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: '#f59e0b'
                  }} />
                  <span style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: '#10b981'
                  }} />
                </div>
                <pre style={{
                  margin: 0,
                  padding: 0,
                  fontSize: '0.85rem',
                  color: '#e2e8f0',
                  fontFamily: 'Monaco, Menlo, monospace',
                  overflowX: 'auto',
                  lineHeight: 1.5,
                  background: '#1e293b'
                }}>
                  <code>{`import { Scene } from 'react-three-lite'

function App() {
  return (
    <Scene style={{ width: '100%', height: '400px' }} />
  )
}`}</code>
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section style={{ marginBottom: '4rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{
              fontSize: '2.5rem',
              fontWeight: 700,
              marginBottom: '1rem',
              color: '#1e293b'
            }}>
              {featuresTitle}
            </h2>
            <p style={{
              fontSize: '1.125rem',
              color: '#64748b',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              {featuresDescription}
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
            maxWidth: '1200px',
            margin: '0 auto'
          }}>
            {features.map((feature, index) => (
              <div
                key={index}
                style={{
                  background: '#fff',
                  padding: '2rem',
                  borderRadius: '16px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                  transition: 'all 0.3s ease',
                  border: '2px solid transparent'
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.borderColor = '#3b82f6';
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.05)';
                  e.currentTarget.style.borderColor = 'transparent';
                }}
              >
                <div style={{
                  fontSize: '3rem',
                  marginBottom: '1rem',
                  background: 'linear-gradient(135deg, #60a5fa 0%, #bfdbfe 100%)',
                  width: '80px',
                  height: '80px',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff'
                }}>
                  {feature.icon}
                </div>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  marginBottom: '0.75rem',
                  color: '#1e293b'
                }}>
                  {feature.title}
                </h3>
                <p style={{
                  color: '#64748b',
                  lineHeight: 1.6
                }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Start Section */}
        <section style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
          padding: '4rem 2rem',
          borderRadius: '20px',
          marginBottom: '4rem',
          textAlign: 'center',
          color: '#fff'
        }}>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            marginBottom: '1rem'
          }}>
            {quickStartTitle}
          </h2>
          <p style={{
            fontSize: '1.125rem',
            marginBottom: '2rem',
            opacity: 0.95
          }}>
            {quickStartDescription}
          </p>
          <Link
            to="/guide/getting-started"
            style={{
              background: '#fff',
              color: '#3b82f6',
              padding: '1rem 2.5rem',
              borderRadius: '12px',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-block',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.25)';
            }}
            onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
            }}
          >
            {readDocs}
          </Link>
        </section>

        {/* Stats Section */}
        <section style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
          padding: '3rem 2rem',
          borderRadius: '16px',
          marginBottom: '4rem'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '2rem',
            maxWidth: '900px',
            margin: '0 auto',
            textAlign: 'center'
          }}>
            {stats.map((stat, index) => (
              <div key={index}>
                <div style={{
                  fontSize: '2.5rem',
                  fontWeight: 700,
                  marginBottom: '0.5rem',
                  color: '#fff'
                }}>
                  {stat.value}
                </div>
                <div style={{
                  fontSize: '1rem',
                  opacity: 0.9,
                  color: '#fff'
                }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Contributors Section */}
        <section style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            marginBottom: '1rem',
            color: '#1e293b'
          }}>
            {contributorsTitle}
          </h2>
          <p style={{
            fontSize: '1.125rem',
            color: '#64748b',
            marginBottom: '2rem'
          }}>
            {contributorsDescription}
          </p>
          <a
            href="https://github.com/sunquakes/react-three-lite/graphs/contributors"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src="https://contrib.rocks/image?repo=sunquakes/react-three-lite"
              alt="Contributors"
              style={{
                borderRadius: '8px',
                maxWidth: '100%',
                height: 'auto'
              }}
            />
          </a>
        </section>
      </main>
    </div>
  );
}