import { useEffect, useRef, useState, type FormEvent, type PointerEvent as PointerEventType, type ReactNode } from 'react';
import { ClerkProvider, SignIn, SignUp, Show, useClerk, useUser } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Beaker, Check, ChevronDown, CircleAlert, Flower2, Leaf, Menu, Package, RefreshCw, ShieldCheck, Sprout, X } from 'lucide-react';
import { Link, Route, Router as WouterRouter, Switch, useLocation, useParams } from 'wouter';
import {
  getGetAdminOverviewQueryKey, getListAdminOrdersQueryKey, getListAdminProductsQueryKey, getListAdminResearchQueryKey,
  getListMyOrdersQueryKey, getListProductsQueryKey, getListResearchQueryKey, useHealthCheck, useCreateOrder, useCreateProduct,
  useCreateResearch, useDeleteProduct, useDeleteResearch, useGetAdminOverview, useGetProduct,
  useGetResearch, useListAdminOrders, useListAdminProducts, useListAdminResearch, useListMyOrders,
  useListProducts, useListResearch, useUpdateOrderStatus, useUpdateProduct, useUpdateResearch,
} from '@workspace/api-client-react';
import type { Order, Product, ProductInput, ResearchEntry, ResearchInput } from '@workspace/api-client-react';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const clerkPubKey = publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
function stripBase(path: string) { return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || '/' : path; }

const appearance = {
  theme: shadcn, cssLayerName: 'clerk',
  options: { logoPlacement: 'inside' as const, logoLinkUrl: basePath || '/', logoImageUrl: `${window.location.origin}${basePath}/logo.svg` },
  variables: {
    colorPrimary: '#264f43', colorForeground: '#243b32', colorMutedForeground: '#69776e', colorDanger: '#a53d37',
    colorBackground: '#f8f6ef', colorInput: '#fcfbf7', colorInputForeground: '#243b32', colorNeutral: '#d1d1c6',
    fontFamily: 'DM Sans', borderRadius: '4px',
  },
  elements: {
    rootBox: 'w-full flex justify-center', cardBox: 'bg-[#f8f6ef] rounded-sm w-[440px] max-w-full overflow-hidden border border-[#ddd9cd]',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none', footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-[#243b32]', headerSubtitle: 'text-[#69776e]', socialButtonsBlockButtonText: 'text-[#243b32]',
    formFieldLabel: 'text-[#47564c]', footerActionLink: 'text-[#264f43]', footerActionText: 'text-[#69776e]',
    dividerText: 'text-[#69776e]', identityPreviewEditButton: 'text-[#264f43]', formFieldSuccessText: 'text-[#264f43]',
    alertText: 'text-[#243b32]', logoBox: 'rounded-sm', logoImage: 'object-contain', socialButtonsBlockButton: 'border-[#d1d1c6]',
    formButtonPrimary: 'bg-[#264f43] text-[#f8f5eb]', formFieldInput: 'border-[#d1d1c6] bg-[#fcfbf7] text-[#243b32]',
    footerAction: 'text-[#69776e]', dividerLine: 'bg-[#d1d1c6]', alert: 'border-[#d1d1c6]', otpCodeFieldInput: 'border-[#d1d1c6]',
    formFieldRow: 'text-[#47564c]', main: 'text-[#243b32]',
  },
};

function ClerkCacheSync() {
  const { addListener } = useClerk();
  const client = useQueryClient();
  const previous = useRef<string | null | undefined>(undefined);
  useEffect(() => addListener(({ user }) => {
    const id = user?.id ?? null;
    if (previous.current !== undefined && previous.current !== id) client.clear();
    previous.current = id;
  }), [addListener, client]);
  return null;
}
function SignInPage() { return <div className="auth-back"><SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} /></div>; }
function SignUpPage() { return <div className="auth-back"><SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} /></div>; }

function Header() {
  const [open, setOpen] = useState(false);
  const { signOut } = useClerk();
  const { isSignedIn, user } = useUser();
  const links = [['Research', '/research'], ['Prototypes', '/products'], ['About', '/about']];
  return <header className="topbar"><div className="wrap nav-wrap">
    <Link href="/" className="brand" data-testid="link-home"><span className="brand-mark"><Flower2 size={20} strokeWidth={1.5}/></span><span>flora<span className="brand-light"> cycle</span><small>RESEARCH · MATERIAL FUTURES</small></span></Link>
    <button className="mobile-menu" aria-label="Toggle navigation" data-testid="button-menu" onClick={() => setOpen(!open)}>{open ? <X/> : <Menu/>}</button>
    <nav className={open ? 'main-nav nav-open' : 'main-nav'}>{links.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>)}<Link href="/contact" onClick={() => setOpen(false)}>Contact</Link></nav>
    <div className="nav-actions">{isSignedIn ? <><Link href="/user-portal" className="nav-user">{user?.firstName || 'My portal'}</Link><button className="nav-signin" onClick={() => signOut({ redirectUrl: basePath || '/' })} data-testid="button-signout">Sign out</button></> : <><Link href="/sign-in" className="nav-signin">Sign in</Link><Link href="/sign-up" className="nav-join">Join the project <ArrowUpRight size={14}/></Link></>}</div>
  </div></header>;
}
function Footer() {
  const health = useHealthCheck();
  return <footer className="footer"><div className="wrap footer-grid"><div><Link href="/" className="brand"><span className="brand-mark"><Flower2 size={19}/></span><span>flora<span className="brand-light"> cycle</span><small>RESEARCH · MATERIAL FUTURES</small></span></Link><p>Exploring what plant and flower by-products might become.</p><div className="api-health" data-testid="status-api-health"><span className={health.isError ? 'health-dot offline' : 'health-dot'}/><span>Research API · {health.isLoading ? 'checking' : health.isError ? 'status unavailable' : health.data?.status || 'connected'}</span></div></div><div><span className="eyebrow">Explore</span><Link href="/research">Research library</Link><Link href="/research/plant-waste">Plant waste</Link><Link href="/research/flower-waste">Flower waste</Link><Link href="/research/laboratory-experiments">Laboratory experiments</Link><Link href="/research/results-and-references">Results & references</Link><Link href="/products">Prototype index</Link><Link href="/safety-sustainability">Safety & sustainability</Link></div><div><span className="eyebrow">Connect</span><Link href="/contact">Contact the project</Link><Link href="/order-request">Order request</Link><Link href="/user-portal">User portal</Link><Link href="/admin">Host access</Link><Link href="/privacy">Privacy notice</Link><Link href="/terms">Terms of use</Link></div><div className="footer-note">All concepts are under development. No safety, performance, or environmental claims are implied.</div></div><div className="wrap footer-bottom"><span>© Flora Cycle · Integrated development project</span><span>Evidence first. Possibility always.</span></div></footer>;
}
function Shell({ children }: { children: ReactNode }) { return <><Header/><main>{children}</main><Footer/></>; }
function ShellPage({ children }: { children: ReactNode }) { return <Shell>{children}</Shell>; }
function LoadingState({ label = 'Loading project records' }: { label?: string }) { return <div className="wrap loading-wrap"><div className="eyebrow">{label}</div><div className="skeleton"/><div className="skeleton"/><div className="skeleton"/></div>; }
function ApiError({ message = 'We could not load this information.', retry }: { message?: string; retry: () => void }) { return <div className="status-box error-box"><CircleAlert size={19}/><div><strong>{message}</strong><p>Check your connection and try again.</p><button className="text-action" onClick={retry}><RefreshCw size={14}/> Try again</button></div></div>; }
function EmptyState({ title, detail }: { title: string; detail: string }) { return <div className="empty-state"><span className="empty-icon"><Sprout size={22}/></span><h3>{title}</h3><p>{detail}</p></div>; }
function SectionTitle({ eyebrow, title, detail }: { eyebrow: string; title: string; detail?: string }) { return <div className="section-title"><span className="eyebrow">{eyebrow}</span><h2 className="serif">{title}</h2>{detail && <p>{detail}</p>}</div>; }
function DateStamp({ value }: { value: string }) { const d = new Date(value); return <time>{Number.isNaN(d.valueOf()) ? 'Date not recorded' : d.toLocaleDateString('en', { year: 'numeric', month: 'short', day: 'numeric' })}</time>; }
function StatusTag({ children }: { children: ReactNode }) { return <span className="tag">{String(children).replaceAll('_', ' ')}</span>; }
function ResearchCard({ item }: { item: ResearchEntry }) { return <Link href={`/research/${item.slug}`} className="research-card" data-testid={`card-research-${item.id}`}><div className="card-kicker"><span className="eyebrow">{item.category || 'Research note'}</span><ArrowUpRight size={17}/></div><h3 className="serif">{item.title}</h3><p>{item.summary}</p><div className="card-bottom"><DateStamp value={item.updatedAt}/><span>Read entry <ArrowRight size={14}/></span></div></Link>; }
function ProductCard({ item }: { item: Product }) { return <Link href={`/products/${item.slug}`} className="product-card" data-testid={`card-product-${item.id}`}><div className="product-visual"><div className="material-art"><span className="orbit orbit-one"/><span className="orbit orbit-two"/><span className="stem"/><span className="petal petal-a"/><span className="petal petal-b"/><span className="petal petal-c"/><span className="core"/></div><span className="visual-code mono">FC / {String(item.id).padStart(3,'0')}</span></div><div className="product-copy"><div className="card-kicker"><StatusTag>{item.status}</StatusTag><ArrowUpRight size={17}/></div><h3 className="serif">{item.name}</h3><p>{item.description}</p><div className="card-bottom"><span>{item.wasteSource || 'Source under study'}</span><span>Explore concept <ArrowRight size={14}/></span></div></div></Link>; }

function Home() {
  const research = useListResearch();
  const products = useListProducts();
  const items = (research.data || []).slice(0, 2);
  const prototypes = (products.data || []).slice(0, 2);
  const homeRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = homeRef.current;
    if (!root) return;
    const elements = [...root.querySelectorAll<HTMLElement>('.scroll-reveal')];
    if (typeof IntersectionObserver === 'undefined') {
      elements.forEach(element => element.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14 });
    elements.forEach(element => observer.observe(element));
    return () => observer.disconnect();
  }, []);
  const tiltBloom = (event: PointerEventType<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 9;
    const y = (0.5 - (event.clientY - bounds.top) / bounds.height) * 7;
    event.currentTarget.style.setProperty('--tilt-x', `${x}deg`);
    event.currentTarget.style.setProperty('--tilt-y', `${y}deg`);
  };
  const resetBloom = (event: PointerEventType<HTMLDivElement>) => {
    event.currentTarget.style.setProperty('--tilt-x', '0deg');
    event.currentTarget.style.setProperty('--tilt-y', '0deg');
  };
  return <ShellPage>
    <div ref={homeRef}>
      <section className="home-hero"><div className="hero-grid wrap"><div className="hero-copy reveal"><span className="eyebrow"><span className="pulse-dot"/> Integrated research & development</span><h1>Waste Today.<br/><em>Sustainable Materials</em><br/>Tomorrow.</h1><p>We’re exploring how plant and flower by-products could become the starting point for new material concepts.</p><div className="hero-actions"><Link href="/research" className="btn">Explore the research <ArrowRight size={15}/></Link><Link href="/about" className="line-link">How we work <ArrowUpRight size={15}/></Link></div><div className="hero-foot"><span>01 — 03</span><span>Research-led material exploration</span></div></div><div className="hero-art reveal-delay" aria-label="Abstract botanical study illustration" onPointerMove={tiltBloom} onPointerLeave={resetBloom}><div className="art-caption"><span className="eyebrow">Field note 001</span><span className="mono">BOTANICAL / MATERIAL</span></div><div className="big-bloom"><span className="bloom-ring ring-a"/><span className="bloom-ring ring-b"/><span className="bloom-ring ring-c"/><span className="bloom-petal bp1"/><span className="bloom-petal bp2"/><span className="bloom-petal bp3"/><span className="bloom-petal bp4"/><span className="bloom-petal bp5"/><span className="bloom-center"/><span className="bloom-stem"/><span className="leaf-shape leaf-left"/><span className="leaf-shape leaf-right"/></div><div className="art-index"><span>01</span><span>Residue / possibility</span></div></div></div><div className="hero-scroll"><span>Scroll to explore</span><ArrowDown size={14}/></div></section>
      <section className="home-intro wrap scroll-reveal"><div className="intro-marker"><span className="eyebrow">A material question</span><span className="intro-line"/></div><div><p className="intro-statement serif">What if the parts of a harvest we leave behind could help shape <em>what comes next?</em></p><p className="intro-description">Flora Cycle brings research, material exploration and early prototypes together. We share the process clearly—including what is still unknown.</p></div></section>
      <section className="home-focus scroll-reveal"><div className="wrap focus-grid"><div className="focus-intro"><span className="eyebrow">The work, in progress</span><h2 className="serif">Curiosity, made<br/><em>tangible.</em></h2><p>From source material to open questions, every step is documented as an invitation to learn—not a promise of a finished material.</p><Link href="/about" className="line-link">Read our approach <ArrowRight size={14}/></Link></div><div className="focus-steps"><div className="focus-step"><span className="step-number">01</span><Beaker size={21}/><div><h3>Study the source</h3><p>Understand what plant and flower residues are available, and what they contain.</p></div></div><div className="focus-step"><span className="step-number">02</span><Leaf size={21}/><div><h3>Explore possibilities</h3><p>Investigate material directions without overstating what the evidence supports.</p></div></div><div className="focus-step"><span className="step-number">03</span><Package size={21}/><div><h3>Share prototypes</h3><p>Make early concepts visible and invite considered requests for discussion.</p></div></div></div></div></section>
      <section className="home-research wrap scroll-reveal"><div className="section-head"><SectionTitle eyebrow="Open notebook" title="Research, in the making" detail="Published entries from an evolving body of work."/><Link href="/research" className="line-link">View all research <ArrowRight size={14}/></Link></div>{research.isLoading ? <div className="two-grid"><div className="skeleton"/><div className="skeleton"/></div> : research.isError ? <ApiError retry={() => research.refetch()}/> : items.length ? <div className="two-grid">{items.map(entry => <ResearchCard key={entry.id} item={entry}/>)}</div> : <EmptyState title="The notebook is being assembled" detail="Published research will appear here when it is ready to share."/>}</section>
      <section className="home-prototypes scroll-reveal"><div className="wrap"><div className="section-head"><SectionTitle eyebrow="Material studies" title="Ideas taking shape" detail="Early-stage concepts are shared for exploration, not as finished or validated materials."/><Link href="/products" className="line-link">Browse concepts <ArrowRight size={14}/></Link></div>{products.isLoading ? <div className="two-grid"><div className="skeleton"/><div className="skeleton"/></div> : products.isError ? <ApiError retry={() => products.refetch()}/> : prototypes.length ? <div className="two-grid">{prototypes.map(item => <ProductCard key={item.id} item={item}/>)}</div> : <EmptyState title="No concepts published yet" detail="We will share prototypes here when project records are ready."/>}</div></section>
      <section className="care-band scroll-reveal"><div className="wrap care-inner"><ShieldCheck size={22}/><div><span className="eyebrow">A note on evidence</span><p>These are research directions and prototypes. No material safety, performance, or environmental benefit is assumed unless it has been specifically assessed and documented.</p></div><Link href="/research" className="line-link">See what we know <ArrowRight size={14}/></Link></div></section>
      <section className="home-cta wrap scroll-reveal"><span className="eyebrow">Be part of the inquiry</span><h2 className="serif">Good research gets<br/><em>better together.</em></h2><p>Explore published work, ask a question, or request a prototype for discussion.</p><div><Link href="/contact" className="btn">Start a conversation <ArrowRight size={15}/></Link></div></section>
    </div>
  </ShellPage>;
}

function About() {
  return <ShellPage><section className="page-hero"><div className="wrap"><span className="eyebrow">About Flora Cycle</span><h1>Material futures start with <em>better questions.</em></h1><p className="lead">An integrated development project exploring plant and flower waste as possible material inputs.</p></div></section><section className="wrap about-story"><div><span className="eyebrow">Our premise</span><h2 className="serif">A starting point,<br/><em>not a conclusion.</em></h2></div><div className="story-copy"><p>Plant and flower by-products are varied, local and often under-described. Flora Cycle asks what might be learned by studying them as potential inputs for material development.</p><p>The work brings together published research, early-stage concepts and a transparent account of what remains unknown. A prototype is an invitation to investigate; it is not a claim of readiness, safety, or impact.</p><div className="notice"><ShieldCheck size={18}/><span>We distinguish observation from interpretation, and possibility from demonstrated performance.</span></div></div></section><section className="method-band"><div className="wrap method-grid"><div><span className="eyebrow">How we work</span><h2 className="serif">A careful cycle<br/>of <em>learning.</em></h2></div><div className="method-list"><div><span>01</span><div><h3>Ask a grounded question</h3><p>Define the source material and the question being explored.</p></div></div><div><span>02</span><div><h3>Document the method</h3><p>Describe work in terms that can be reviewed and understood.</p></div></div><div><span>03</span><div><h3>Name limitations</h3><p>Make gaps, constraints and untested properties visible.</p></div></div><div><span>04</span><div><h3>Share the next step</h3><p>Keep the work open to useful critique and further study.</p></div></div></div></div></section><section className="wrap about-bottom"><span className="eyebrow">Follow the work</span><p className="serif">Read the notebook or browse current concepts as they are published.</p><div><Link href="/research" className="btn">Research library <ArrowRight size={15}/></Link><Link href="/products" className="line-link">Prototype index <ArrowUpRight size={14}/></Link></div></section></ShellPage>;
}
function ResearchPage() {
  const query = useListResearch();
  const [filter, setFilter] = useState('All entries');
  const entries = query.data || [];
  const categories = ['All entries', ...Array.from(new Set(entries.map(item => item.category).filter(Boolean)))];
  const filtered = filter === 'All entries' ? entries : entries.filter(item => item.category === filter);
  return <ShellPage><section className="page-hero"><div className="wrap"><span className="eyebrow">Research library / 01</span><h1>The work behind<br/><em>the possibility.</em></h1><p className="lead">A public notebook of questions, methods and evolving observations. Published entries only.</p></div></section><section className="wrap listing-section"><div className="listing-toolbar"><span className="eyebrow">{entries.length} {entries.length === 1 ? 'published entry' : 'published entries'}</span>{!query.isLoading && !query.isError && entries.length > 0 && <label className="filter-label">Filter <select value={filter} onChange={e => setFilter(e.target.value)} data-testid="select-research-category">{categories.map(cat => <option key={cat}>{cat}</option>)}</select><ChevronDown size={14}/></label>}</div>{query.isLoading ? <div className="card-list"><div className="skeleton"/><div className="skeleton"/></div> : query.isError ? <ApiError retry={() => query.refetch()}/> : filtered.length ? <div className="card-list">{filtered.map(item => <ResearchCard key={item.id} item={item}/>)}</div> : <EmptyState title="Nothing published in this section yet" detail="As research is reviewed for publication, it will be added here."/>}</section></ShellPage>;
}
function ResearchTopicPage({ title, description, categoryTerms }: { title: string; description: string; categoryTerms: string[] }) {
  const q = useListResearch();
  const entries = (q.data || []).filter(item => categoryTerms.some(term => item.category.toLowerCase().includes(term)));
  return <ShellPage><section className="page-hero"><div className="wrap"><span className="eyebrow">Research library / topic</span><h1>{title}</h1><p className="lead">{description}</p></div></section><section className="wrap listing-section">{q.isLoading ? <LoadingState/> : q.isError ? <ApiError retry={() => q.refetch()}/> : entries.length ? <div className="card-list">{entries.map(item => <ResearchCard key={item.id} item={item}/>)}</div> : <EmptyState title="No published records in this topic" detail="This section will show entries when Flora Cycle supplies and publishes the corresponding research. No results have been inferred or filled in."/>}</section></ShellPage>;
}
function ResearchDetail() {
  const { slug = '' } = useParams<{ slug: string }>();
  const q = useGetResearch(slug);
  const entry = q.data as ResearchEntry | undefined;
  if (q.isLoading) return <ShellPage><LoadingState label="Opening research entry"/></ShellPage>;
  if (q.isError || !entry) return <ShellPage><div className="wrap detail-state">{q.isError ? <ApiError message="This research entry could not be found or loaded." retry={() => q.refetch()}/> : <EmptyState title="Entry unavailable" detail="This record is not currently published."/>}<Link href="/research" className="line-link"><ArrowLeft size={14}/> Back to research</Link></div></ShellPage>;
  return <ShellPage><div className="wrap detail-page"><Link href="/research" className="back-link"><ArrowLeft size={14}/> Research library</Link><span className="eyebrow">{entry.category} · Updated <DateStamp value={entry.updatedAt}/></span><h1 className="serif">{entry.title}</h1><p className="detail-summary">{entry.summary}</p><div className="detail-content"><div className="detail-main">{[['Objective', entry.objective], ['Methodology', entry.methodology], ['Observations', entry.observations], ['Limitations', entry.limitations], ['Next steps', entry.nextSteps]].map(([heading, text]) => <section key={heading}><h2 className="serif">{heading}</h2><p>{text || 'Not documented in this entry.'}</p></section>)}</div><aside><span className="eyebrow">Research record</span><p>Published entry</p><div className="detail-rule"/><span className="eyebrow">Status</span><StatusTag>{entry.status}</StatusTag><div className="detail-rule"/><span className="small-note">No findings beyond those described in this record are implied.</span></aside></div></div></ShellPage>;
}
function SafetyPage() {
  return <ShellPage><section className="page-hero"><div className="wrap"><span className="eyebrow">Material safety & sustainability</span><h1>Words matter.<br/><em>Evidence matters more.</em></h1><p className="lead">Natural origin alone does not establish safety, biodegradation, compostability, food-contact suitability, or edibility.</p></div></section><section className="wrap about-story"><div><span className="eyebrow">Current evidence status</span><h2 className="serif">No verified test results have been supplied.</h2></div><div className="story-copy"><p>Flora Cycle has not provided material-specific test results, testing conditions, standards, or certifications for publication. Until such information is supplied and reviewed, all material properties remain unverified.</p><div className="safety-grid">{[['Bio-based','Describes a material’s biological feedstock; it does not by itself describe how the material breaks down.'],['Biodegradable','Requires defined test conditions and evidence; the word alone does not specify a timeframe or environment.'],['Compostable','Is not interchangeable with biodegradable and must be supported by relevant testing and conditions.'],['Food-contact suitable','Requires an appropriate safety assessment for the intended use and contact conditions.'],['Edible','Is a distinct claim and must not be inferred from natural or bio-based ingredients.']].map(([term,detail])=><article className="safety-item" key={term}><span className="eyebrow">{term}</span><p>{detail}</p></article>)}</div><p className="small-note">This page is informational and is not a safety certification or material assessment.</p></div></section></ShellPage>;
}
function LegalPage({ kind }: { kind: 'privacy' | 'terms' }) {
  const privacy = kind === 'privacy';
  return <ShellPage><section className="page-hero"><div className="wrap"><span className="eyebrow">{privacy ? 'Privacy notice' : 'Terms of use'}</span><h1>{privacy ? <>Your information,<br/><em>handled with care.</em></> : <>A clear record<br/><em>of what this is.</em></>}</h1><p className="lead">Draft notice for the Flora Cycle project website.</p></div></section><section className="wrap legal-copy"><div className="notice"><CircleAlert size={18}/><span>This draft needs review by the project owner and qualified counsel before it is used as a final legal policy.</span></div>{privacy ? <><h2 className="serif">Information used by this first release</h2><p>Account sign-in is provided by Clerk. When an account opens its request history or submits a request, this app stores the account identifier, email address, name when available, the requested prototype, quantity, reference, status and timestamps. The app does not request payment details, shipping addresses, or phone numbers.</p><p>The contact page currently prepares an on-screen draft only; it does not send or store that message. Email and WhatsApp notifications are not configured. The project owner should define retention, deletion, contact, and jurisdiction-specific rights before launch.</p></> : <><h2 className="serif">Requests are not purchases</h2><p>Product and research pages may contain clearly labeled demonstration placeholders. A request submitted through this site is an inquiry for discussion, not a purchase, reservation, payment, or promise of delivery. No payment information is collected.</p><p>Visitors should rely only on the information stated in a published research record. No safety, performance, food-contact, edibility, biodegradation, compostability, or environmental benefit is promised unless separately evidenced and documented.</p></>}<p className="small-note">Last reviewed: draft awaiting project-owner review.</p></section></ShellPage>;
}
function OrderRequestPage() {
  const products = useListProducts();
  return <ShellPage><section className="page-hero"><div className="wrap"><span className="eyebrow">Order request</span><h1>A request is a<br/><em>conversation starter.</em></h1><p className="lead">Flora Cycle does not take payments through this site. A request is saved for host review and is not a completed purchase.</p></div></section><section className="wrap listing-section"><div className="care-band"><div className="care-inner"><ShieldCheck size={20}/><div><span className="eyebrow">Before you request</span><p>Sign in with a verified email. The host must publish a concept and open its request window. Availability and quantities are checked by the server.</p></div><Link href="/user-portal" className="line-link">View my requests <ArrowRight size={14}/></Link></div></div><div className="section-head"><SectionTitle eyebrow="Published concepts" title="Choose a concept" detail="Requests are available only on individual prototype records whose request window is open."/></div>{products.isLoading ? <LoadingState/> : products.isError ? <ApiError retry={() => products.refetch()}/> : products.data?.length ? <div className="product-grid">{products.data.map(item => <ProductCard key={item.id} item={item}/>)}</div> : <EmptyState title="No concepts are open for requests" detail="Published concepts will appear here when the host makes them available for discussion."/>}</section></ShellPage>;
}
function ProductsPage() {
  const q = useListProducts();
  const products = (q.data || []).filter(item => item.published);
  return <ShellPage><section className="page-hero"><div className="wrap"><span className="eyebrow">Prototype index / 02</span><h1>Material ideas,<br/><em>made visible.</em></h1><p className="lead">A catalog of published concepts in development. Each record describes intent—not verified performance or readiness.</p></div></section><section className="wrap listing-section"><div className="listing-toolbar"><span className="eyebrow">{products.length} published {products.length === 1 ? 'concept' : 'concepts'}</span><span className="catalog-note">All requests are for discussion only.</span></div>{q.isLoading ? <div className="two-grid"><div className="skeleton"/><div className="skeleton"/></div> : q.isError ? <ApiError retry={() => q.refetch()}/> : products.length ? <div className="product-grid">{products.map(item => <ProductCard key={item.id} item={item}/>)}</div> : <EmptyState title="The prototype index is taking shape" detail="Published concepts will appear here when they are ready for a public record."/>}</section></ShellPage>;
}
function ProductsDetail() {
  const { slug = '' } = useParams<{ slug: string }>();
  const q = useGetProduct(slug);
  const p = q.data as Product | undefined;
  const create = useCreateOrder();
  const [quantity, setQuantity] = useState(1);
  const [submitted, setSubmitted] = useState<Order | null>(null);
  const [problem, setProblem] = useState('');
  const { isSignedIn } = useUser();
  const client = useQueryClient();
  if (q.isLoading) return <ShellPage><LoadingState label="Opening prototype record"/></ShellPage>;
  if (q.isError || !p || !p.published) return <ShellPage><div className="wrap detail-state">{q.isError ? <ApiError message="This prototype record could not be found or loaded." retry={() => q.refetch()}/> : <EmptyState title="Concept unavailable" detail="This record is not currently published."/>}<Link href="/products" className="line-link"><ArrowLeft size={14}/> Prototype index</Link></div></ShellPage>;
  const submit = (e: FormEvent) => {
    e.preventDefault(); setProblem(''); setSubmitted(null);
    create.mutate({ data: { productId: p.id, quantity: Math.max(1, Number(quantity)) } }, {
      onSuccess: result => { setSubmitted(result as Order); client.invalidateQueries({ queryKey: getListMyOrdersQueryKey() }); },
      onError: error => setProblem((error as Error)?.message || 'The request could not be submitted. Please sign in and try again.'),
    });
  };
  const canRequest = p.availability === 'request_open';
  return <ShellPage><div className="wrap detail-page product-detail"><Link href="/products" className="back-link"><ArrowLeft size={14}/> Prototype index</Link><div className="product-detail-head"><div><span className="eyebrow">Concept record / {p.slug}</span><h1 className="serif">{p.name}</h1><p className="detail-summary">{p.description}</p><StatusTag>{p.status}</StatusTag></div><div className="detail-art large-art"><div className="material-art"><span className="orbit orbit-one"/><span className="orbit orbit-two"/><span className="stem"/><span className="petal petal-a"/><span className="petal petal-b"/><span className="petal petal-c"/><span className="core"/></div><span className="visual-code mono">FLORA / STUDY {String(p.id).padStart(2,'0')}</span></div></div><div className="detail-content product-detail-body"><div className="detail-main">{[['Waste source', p.wasteSource], ['Composition', p.composition], ['Intended use', p.intendedUse], ['Request availability', canRequest ? 'Requests open for discussion' : 'Requests currently closed']].map(([heading, text]) => <section key={heading}><h2 className="serif">{heading}</h2><p>{text || 'Not specified in this record.'}</p></section>)}</div><aside className="request-panel"><span className="eyebrow">Request a conversation</span><h3 className="serif">Interested in exploring?</h3><p className="small-note">This submits a request only. It is not a purchase, reservation, or statement of material readiness. No payment is collected.</p><p className="small-note">Your account name and email are shared with the host to review this request.</p>{canRequest && <p className="request-min">Minimum request quantity <strong>{p.minimumOrderQuantity}</strong></p>}{submitted ? <div className="success-box"><Check size={18}/><div><strong>Request received</strong><p>Reference {submitted.reference}. Status: {submitted.status.replaceAll('_',' ')}.</p></div></div> : !canRequest ? <div className="status-box"><strong>Requests are closed</strong><p>This concept is not currently accepting requests.</p></div> : isSignedIn ? <form onSubmit={submit} className="request-form"><label className="field">Quantity<input type="number" min={p.minimumOrderQuantity} max="10000" value={quantity} onChange={e => setQuantity(Number(e.target.value))} required data-testid="input-order-quantity"/></label>{problem && <p className="form-error">{problem}</p>}<button className="btn" disabled={create.isPending}>{create.isPending ? 'Sending request…' : 'Submit request'} <ArrowRight size={14}/></button></form> : <Link href="/sign-in" className="btn">Sign in to request <ArrowRight size={14}/></Link>}</aside></div></div></ShellPage>;
}
function Contact() {
  const [draft, setDraft] = useState(false);
  const submit = (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); setDraft(true); };
  return <ShellPage><section className="page-hero"><div className="wrap"><span className="eyebrow">Contact / Start a conversation</span><h1>Bring a good<br/><em>question.</em></h1><p className="lead">Use this space to shape an inquiry about the work, a published study or a prototype concept.</p></div></section><section className="wrap contact-layout"><div className="contact-aside"><span className="eyebrow">Before you write</span><h2 className="serif">Specific questions<br/>help us respond.</h2><p>There is no published contact address in this project record. This form prepares a local inquiry draft; it does not transmit or store a message.</p><div className="contact-note"><ShieldCheck size={18}/><span>We do not collect claims or assurances beyond the evidence in published records.</span></div></div><form className="contact-form surface" onSubmit={submit}><span className="eyebrow">Inquiry draft</span><label className="field">Your name<input required placeholder="Name" data-testid="input-contact-name"/></label><label className="field">Your email<input type="email" required placeholder="name@example.org" data-testid="input-contact-email"/></label><label className="field">Topic<select defaultValue="" required data-testid="select-contact-topic"><option value="" disabled>Choose a topic</option><option>Research question</option><option>Prototype discussion</option><option>Project collaboration</option><option>Other</option></select></label><label className="field">Message<textarea required placeholder="What would you like to explore?" data-testid="input-contact-message"/></label>{draft && <div className="notice"><Check size={17}/><span>Your inquiry draft is ready in this form. It has not been sent; no contact endpoint is configured.</span></div>}<button type="submit" className="btn">Prepare inquiry <ArrowRight size={14}/></button></form></section></ShellPage>;
}
function NeedSignIn() { return <div className="protected-gate"><span className="gate-mark"><ShieldCheck/></span><span className="eyebrow">Account required</span><h2 className="serif">Your project space.</h2><p>Sign in to view your request history and personal account information.</p><Link href="/sign-in" className="btn">Sign in to continue <ArrowRight size={14}/></Link><Link href="/sign-up" className="line-link">Create an account</Link></div>; }
function UserPortal() {
  const { isSignedIn } = useUser();
  const q = useListMyOrders({ query: { enabled: !!isSignedIn, queryKey: getListMyOrdersQueryKey() } });
  return <ShellPage><section className="page-hero portal-hero"><div className="wrap"><span className="eyebrow">User portal / Your activity</span><h1>A place for your<br/><em>requests.</em></h1><p className="lead">Review request-only orders and their current status.</p></div></section>{!isSignedIn ? <NeedSignIn/> : <section className="wrap portal-content"><div className="portal-heading"><div><span className="eyebrow">My requests</span><h2 className="serif">Request history</h2></div><Link href="/products" className="line-link">Explore prototypes <ArrowRight size={14}/></Link></div>{q.isLoading ? <div className="skeleton"/> : q.isError ? <ApiError message="Your requests could not be loaded. The server response has not been replaced with sample data." retry={() => q.refetch()}/> : q.data?.length ? <div className="orders-table"><div className="order-row order-head"><span>Reference</span><span>Prototype</span><span>Quantity</span><span>Status</span><span>Submitted</span></div>{q.data.map(order => <div key={order.id} className="order-row" data-testid={`order-${order.id}`}><strong>{order.reference}</strong><span>{order.productName}</span><span>{order.quantity}</span><StatusTag>{order.status}</StatusTag><DateStamp value={order.createdAt}/></div>)}</div> : <EmptyState title="No requests yet" detail="When you request a prototype for discussion, its status will appear here."/>}</section>}</ShellPage>;
}

type AdminTab = 'overview' | 'research' | 'products' | 'orders';
function AdminGate({ error }: { error?: unknown }) {
  const text = String((error as Error)?.message || '');
  const forbidden = /403|forbidden|allowlist|allow list|host/i.test(text);
  return <div className="admin-gate"><span className="gate-mark"><ShieldCheck/></span><span className="eyebrow">{forbidden ? 'Host access unavailable' : 'Permission required'}</span><h2 className="serif">{forbidden ? 'Host allowlist needed.' : 'Admin access could not be confirmed.'}</h2><p>{forbidden ? 'The server has blocked this host. Configure the API server host allowlist for this deployment, then retry. Access is never granted by the interface alone.' : 'The protected admin API did not authorize this request. Sign in with a permitted host account, or ask the project host to confirm your access.'}</p>{error != null && <details><summary>Server response</summary><pre>{text.slice(0,600) || 'No additional error details were returned.'}</pre></details>}</div>;
}
function useAdminInvalidation() {
  const client = useQueryClient();
  return () => {
    void client.invalidateQueries({ queryKey: getGetAdminOverviewQueryKey() });
    void client.invalidateQueries({ queryKey: getListAdminResearchQueryKey() });
    void client.invalidateQueries({ queryKey: getListAdminProductsQueryKey() });
    void client.invalidateQueries({ queryKey: getListAdminOrdersQueryKey() });
    void client.invalidateQueries({ queryKey: getListResearchQueryKey() });
    void client.invalidateQueries({ queryKey: getListProductsQueryKey() });
    void client.invalidateQueries({ predicate: query => typeof query.queryKey[0] === 'string' && query.queryKey[0].startsWith('/api/research/') });
    void client.invalidateQueries({ predicate: query => typeof query.queryKey[0] === 'string' && query.queryKey[0].startsWith('/api/products/') });
  };
}
function AdminResearchEditor({ item, close, refresh }: { item?: ResearchEntry; close: () => void; refresh: () => void }) {
  const create = useCreateResearch(); const update = useUpdateResearch();
  const [error, setError] = useState('');
  const formSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setError('');
    const f = new FormData(e.currentTarget);
    const data: ResearchInput = { title: String(f.get('title')), slug: String(f.get('slug')), summary: String(f.get('summary')), category: String(f.get('category')), status: String(f.get('status')) as ResearchInput['status'], objective: String(f.get('objective')), methodology: String(f.get('methodology')), observations: String(f.get('observations')), limitations: String(f.get('limitations')), nextSteps: String(f.get('nextSteps')) };
    const done = () => { refresh(); close(); };
    if (item) update.mutate({ id: item.id, data }, { onSuccess: done, onError: e2 => setError((e2 as Error).message) });
    else create.mutate({ data }, { onSuccess: done, onError: e2 => setError((e2 as Error).message) });
  };
  return <form onSubmit={formSubmit} className="admin-editor"><div className="editor-heading"><span className="eyebrow">{item ? 'Edit record' : 'New research record'}</span><button type="button" className="icon-button" onClick={close} aria-label="Close editor"><X size={18}/></button></div><div className="editor-fields"><label className="field">Title<input name="title" defaultValue={item?.title} required/></label><label className="field">Slug<input name="slug" defaultValue={item?.slug} required pattern="[a-z0-9]+(?:-[a-z0-9]+)*"/></label><label className="field">Category<input name="category" defaultValue={item?.category}/></label><label className="field">Status<select name="status" defaultValue={item?.status || 'draft'}>{['draft','pending_review','published','archived'].map(s=><option key={s}>{s}</option>)}</select></label><label className="field field-wide">Summary<textarea name="summary" defaultValue={item?.summary}/></label>{[['Objective','objective'],['Methodology','methodology'],['Observations','observations'],['Limitations','limitations'],['Next steps','nextSteps']].map(([label,name])=><label className="field field-wide" key={name}>{label}<textarea name={name} defaultValue={item?.[name as keyof ResearchEntry] as string}/></label>)}</div>{error && <p className="form-error">{error}</p>}<button className="btn" disabled={create.isPending||update.isPending}>{create.isPending||update.isPending?'Saving…':item?'Save changes':'Create record'}</button></form>;
}
function AdminProductEditor({ item, close, refresh }: { item?: Product; close: () => void; refresh: () => void }) {
  const create = useCreateProduct(); const update = useUpdateProduct(); const [error,setError]=useState('');
  const submit = (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); setError(''); const f=new FormData(e.currentTarget);
    const data: ProductInput = { name:String(f.get('name')),slug:String(f.get('slug')),description:String(f.get('description')),wasteSource:String(f.get('wasteSource')),composition:String(f.get('composition')),intendedUse:String(f.get('intendedUse')),status:String(f.get('status')) as ProductInput['status'],availability:String(f.get('availability')),minimumOrderQuantity:Math.max(1,Number(f.get('minimumOrderQuantity'))),published:f.get('published')==='on' };
    const done=()=>{refresh();close();};
    if(item) update.mutate({id:item.id,data},{onSuccess:done,onError:e2=>setError((e2 as Error).message)}); else create.mutate({data},{onSuccess:done,onError:e2=>setError((e2 as Error).message)});
  };
  return <form onSubmit={submit} className="admin-editor"><div className="editor-heading"><span className="eyebrow">{item?'Edit concept':'New prototype record'}</span><button type="button" className="icon-button" onClick={close} aria-label="Close editor"><X size={18}/></button></div><div className="editor-fields"><label className="field">Name<input name="name" defaultValue={item?.name} required/></label><label className="field">Slug<input name="slug" defaultValue={item?.slug} required pattern="[a-z0-9]+(?:-[a-z0-9]+)*"/></label><label className="field field-wide">Description<textarea name="description" defaultValue={item?.description}/></label><label className="field">Waste source<input name="wasteSource" defaultValue={item?.wasteSource}/></label><label className="field">Composition<input name="composition" defaultValue={item?.composition}/></label><label className="field">Intended use<input name="intendedUse" defaultValue={item?.intendedUse}/></label><label className="field">Availability<input name="availability" defaultValue={item?.availability}/></label><label className="field">Status<select name="status" defaultValue={item?.status||'research_stage'}>{['research_stage','prototype','testing','ready_for_launch','available'].map(s=><option key={s}>{s}</option>)}</select></label><label className="field">Minimum request quantity<input name="minimumOrderQuantity" type="number" min="1" defaultValue={item?.minimumOrderQuantity||1}/></label><label className="checkbox-field"><input name="published" type="checkbox" defaultChecked={item?.published}/> Published to public catalog</label></div>{error&&<p className="form-error">{error}</p>}<button className="btn" disabled={create.isPending||update.isPending}>{create.isPending||update.isPending?'Saving…':item?'Save changes':'Create record'}</button></form>;
}
function Admin() {
  const {isSignedIn}=useUser(); const [tab,setTab]=useState<AdminTab>('overview'); const [researchEditor,setResearchEditor]=useState<ResearchEntry|true|false>(false); const [productEditor,setProductEditor]=useState<Product|true|false>(false);
  const overview=useGetAdminOverview({query:{enabled:!!isSignedIn,queryKey:getGetAdminOverviewQueryKey()}});
  const research=useListAdminResearch({query:{enabled:!!isSignedIn&&tab==='research',queryKey:getListAdminResearchQueryKey()}});
  const products=useListAdminProducts({query:{enabled:!!isSignedIn&&tab==='products',queryKey:getListAdminProductsQueryKey()}});
  const orders=useListAdminOrders({query:{enabled:!!isSignedIn&&tab==='orders',queryKey:getListAdminOrdersQueryKey(),refetchInterval:15000,refetchOnWindowFocus:true}});
  const updateStatus=useUpdateOrderStatus(); const refresh=useAdminInvalidation();
  const [actionError,setActionError]=useState('');
  const deleteResearch=useDeleteResearch(); const deleteProduct=useDeleteProduct();
  const accessError=overview.error || (tab==='research'?research.error:tab==='products'?products.error:tab==='orders'?orders.error:undefined);
  const detailError=String((accessError as Error)?.message||'');
  const likelyNoAccess=!!accessError && (/401|403|unauthorized|forbidden|allowlist|allow list/i.test(detailError));
  if(!isSignedIn) return <ShellPage><section className="page-hero"><div className="wrap"><span className="eyebrow">Flora Cycle / Host console</span><h1>Content, carefully<br/><em>managed.</em></h1></div></section><NeedSignIn/></ShellPage>;
  if(likelyNoAccess) return <ShellPage><section className="page-hero"><div className="wrap"><span className="eyebrow">Flora Cycle / Host console</span><h1>Content, carefully<br/><em>managed.</em></h1></div></section><div className="wrap"><AdminGate error={accessError}/></div></ShellPage>;
  const nav: [AdminTab,string][]=[['overview','Overview'],['research','Research'],['products','Prototypes'],['orders','Requests']];
  return <ShellPage><section className="admin-shell"><div className="wrap"><div className="admin-top"><div><span className="eyebrow">Flora Cycle / Host console</span><h1 className="serif">Project desk<span>.</span></h1></div><span className="host-badge"><ShieldCheck size={14}/> Host view</span></div><div className="admin-tabs">{nav.map(([key,label])=><button key={key} className={tab===key?'active':''} onClick={()=>{setTab(key);setResearchEditor(false);setProductEditor(false);setActionError('');}} data-testid={`tab-admin-${key}`}>{label}</button>)}</div>
  {tab==='overview' && <div className="admin-content">{overview.isLoading?<div className="metric-grid">{[1,2,3,4].map(x=><div className="skeleton" key={x}/>)}</div>:overview.isError?<ApiError retry={()=>overview.refetch()}/>:<><div className="metric-grid">{[['Registered users',overview.data?.registeredUsers],['Pending requests',overview.data?.pendingOrders],['Total requests',overview.data?.totalOrders],['Published research',overview.data?.publishedResearch],['Published concepts',overview.data?.publishedProducts]].map(([label,value])=><div className="metric-card" key={String(label)}><span className="eyebrow">{label}</span><strong>{value ?? '—'}</strong></div>)}</div><div className="admin-note"><span className="eyebrow">Host operations</span><p>Content and request changes are saved through protected server APIs. If the server denies access, this desk will show that response rather than simulate host permissions.</p></div></>}</div>}
  {tab==='research' && <div className="admin-content"><div className="admin-list-head"><div><span className="eyebrow">Research records</span><h2 className="serif">Notebook entries</h2></div><button className="btn" onClick={()=>setResearchEditor(true)}><span>+</span> New entry</button></div>{researchEditor && <AdminResearchEditor item={researchEditor===true?undefined:researchEditor} close={()=>setResearchEditor(false)} refresh={refresh}/ >}{research.isLoading?<div className="skeleton"/>:research.isError?<ApiError retry={()=>research.refetch()}/>:research.data?.length?<div className="manage-list">{research.data.map(r=><div className="manage-row" key={r.id}><div><span className="eyebrow">{r.category} · {r.slug}</span><strong>{r.title}</strong></div><StatusTag>{r.status}</StatusTag><button className="text-action" onClick={()=>setResearchEditor(r)}>Edit</button><button className="text-action danger-action" disabled={deleteResearch.isPending} onClick={()=>{if(window.confirm(`Delete “${r.title}”? This cannot be undone.`)){deleteResearch.mutate({id:r.id},{onSuccess:refresh,onError:e=>setActionError((e as Error).message)});}}}>Delete</button></div>)}</div>:<EmptyState title="No research records" detail="Create the first research record when reviewed content is ready."/>}{actionError&&<p className="form-error">{actionError}</p>}</div>}
  {tab==='products' && <div className="admin-content"><div className="admin-list-head"><div><span className="eyebrow">Prototype records</span><h2 className="serif">Concept index</h2></div><button className="btn" onClick={()=>setProductEditor(true)}><span>+</span> New concept</button></div>{productEditor&&<AdminProductEditor item={productEditor===true?undefined:productEditor} close={()=>setProductEditor(false)} refresh={refresh}/ >}{products.isLoading?<div className="skeleton"/>:products.isError?<ApiError retry={()=>products.refetch()}/>:products.data?.length?<div className="manage-list">{products.data.map(p=><div className="manage-row" key={p.id}><div><span className="eyebrow">{p.slug}</span><strong>{p.name}</strong></div><StatusTag>{p.published?'published':'unpublished'}</StatusTag><StatusTag>{p.status}</StatusTag><button className="text-action" onClick={()=>setProductEditor(p)}>Edit</button><button className="text-action danger-action" disabled={deleteProduct.isPending} onClick={()=>{if(window.confirm(`Delete “${p.name}”? This cannot be undone.`)){deleteProduct.mutate({id:p.id},{onSuccess:refresh,onError:e=>setActionError((e as Error).message)});}}}>Delete</button></div>)}</div>:<EmptyState title="No prototype records" detail="Create a concept record when there is reviewed information to share."/>}{actionError&&<p className="form-error">{actionError}</p>}</div>}
  {tab==='orders'&&<div className="admin-content"><div className="admin-list-head"><div><span className="eyebrow">Request queue</span><h2 className="serif">Submitted requests</h2></div><span className="small-note">Refreshes every 15 seconds · no payment is collected</span></div>{orders.isLoading?<div className="skeleton"/>:orders.isError?<ApiError retry={()=>orders.refetch()}/>:orders.data?.length?<div className="orders-table admin-orders"><div className="order-row order-head"><span>Reference</span><span>Concept</span><span>Customer</span><span>Quantity</span><span>Submitted</span><span>Update status</span></div>{orders.data.map((o:Order)=><div className="order-row" key={o.id}><strong>{o.reference}</strong><span>{o.productName}</span><span>{o.customerName || o.customerEmail || 'Account details unavailable'}{o.customerEmail && o.customerName && <small className="customer-email">{o.customerEmail}</small>}</span><span>{o.quantity}</span><DateStamp value={o.createdAt}/><select aria-label={`Update status for ${o.reference}`} value={o.status} disabled={updateStatus.isPending} onChange={e=>{setActionError('');updateStatus.mutate({id:o.id,data:{status:e.target.value as Order['status']}},{onSuccess:refresh,onError:er=>setActionError((er as Error).message)});}}>{['new','under_review','confirmed','processing','shipped','delivered','cancelled'].map(s=><option key={s}>{s}</option>)}</select></div>)}</div>:<EmptyState title="No requests to review" detail="New request-only orders will appear here."/>}{actionError&&<p className="form-error">{actionError}</p>}</div>}
  </div></section></ShellPage>;
}

function HomeRoute() { return <Home/>; }
function ClerkRoutes() {
  const [, setLocation]=useLocation();
  return <ClerkProvider publishableKey={clerkPubKey} proxyUrl={clerkProxyUrl} appearance={appearance} signInUrl={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} localization={{signIn:{start:{title:'Welcome back',subtitle:'Return to the Flora Cycle project'}},signUp:{start:{title:'Join the inquiry',subtitle:'Create your Flora Cycle account'}}}} routerPush={to=>setLocation(stripBase(to))} routerReplace={to=>setLocation(stripBase(to),{replace:true})}>
    <QueryClientProvider client={queryClient}><ClerkCacheSync/><Switch>
      <Route path="/" component={HomeRoute}/><Route path="/about" component={About}/><Route path="/research" component={ResearchPage}/><Route path="/research/plant-waste">{() => <ResearchTopicPage title="Plant waste research" description="Published records concerning plant-waste sourcing, preparation and material exploration." categoryTerms={['plant']}/>}</Route><Route path="/research/flower-waste">{() => <ResearchTopicPage title="Flower waste research" description="Published records concerning flower-waste sourcing, preparation and material exploration." categoryTerms={['flower']}/>}</Route><Route path="/research/laboratory-experiments">{() => <ResearchTopicPage title="Laboratory experiments" description="Methods and observations appear here only when they have been supplied and approved for publication." categoryTerms={['laboratory','experiment','method']}/>}</Route><Route path="/research/results-and-references">{() => <ResearchTopicPage title="Results & references" description="Measured results and sources are not inferred; each published record carries only the information provided for that study." categoryTerms={['result','reference']}/>}</Route><Route path="/research/:slug" component={ResearchDetail}/><Route path="/safety-sustainability" component={SafetyPage}/><Route path="/products" component={ProductsPage}/><Route path="/products/:slug" component={ProductsDetail}/><Route path="/order-request" component={OrderRequestPage}/><Route path="/contact" component={Contact}/><Route path="/privacy" component={() => <LegalPage kind="privacy"/>}/><Route path="/terms" component={() => <LegalPage kind="terms"/>}/><Route path="/user-portal" component={UserPortal}/><Route path="/admin" component={Admin}/><Route path="/sign-in/*?" component={SignInPage}/><Route path="/sign-up/*?" component={SignUpPage}/><Route component={NotFound}/>
    </Switch></QueryClientProvider>
  </ClerkProvider>;
}
function App() {
  if (!clerkPubKey) return <div className="config-error"><div><Flower2/><h1 className="serif">Flora Cycle is not configured yet.</h1><p>Set up Clerk and provide VITE_CLERK_PUBLISHABLE_KEY to enable account and request workflows.</p></div></div>;
  return <WouterRouter base={basePath}><ClerkRoutes/></WouterRouter>;
}
export default App;
