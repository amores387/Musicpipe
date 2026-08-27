import React, { useEffect, useMemo, useState } from "react";
import { Route, Switch, Router as WouterRouter } from "wouter";
import {
  BadgeCheck,
  Check,
  ChevronRight,
  Clipboard,
  Copy,
  Download,
  Headphones,
  Heart,
  Info,
  Lock,
  MessageCircle,
  Mic2,
  Music,
  Plus,
  Radio,
  Search,
  Send,
  ShieldCheck,
  Star,
  Trash2,
  Unlock,
  User,
  X,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  getGetVercelStatusQueryKey,
  getHealthCheckQueryKey,
  useGetVercelStatus,
  useHealthCheck,
} from "@workspace/api-client-react";

interface Song {
  id: number;
  title: string;
  artist: string | null;
  fileId: string;
  isAdmin?: boolean;
  isAlbum?: boolean;
}

interface Comment {
  id: number;
  name: string;
  text: string;
  rating: number;
  date: string;
}

const BASE_SONGS: Song[] = [
  { id: 1, title: "Wala Kang Katulad", artist: null, fileId: "1d2honIvYSusTeLwt_Fjrp3Nuc8N_BaL6" },
  { id: 2, title: "Ako Nalang Ulit", artist: null, fileId: "1ejVOZn3Ev8RVL-twfaW9-TN4vvI0FW1b" },
  { id: 3, title: "Umiiyak ang Puso Ko", artist: null, fileId: "1ekeDflKtGuVPD7h46Nvv6FXRErZx3mJ3" },
  { id: 4, title: "Nothing Gonna Change", artist: null, fileId: "1ewtcIYUUFWhwzb5-08y0frCb610CgpDc" },
  { id: 5, title: "On Bended Knee", artist: null, fileId: "1f7mDyykhIyzcRhBAOsnnJiteLL8rYLlg" },
  { id: 6, title: "Labis Na Nasaktan", artist: null, fileId: "126C5L_4NZPt3Tys0EFKeG0XQ7KVXxp17" },
  { id: 7, title: "If Ever You're in My Arms Again", artist: null, fileId: "128IQ26b-b6G2k1hf-vwiXzI2hZZ3UQuh" },
  { id: 8, title: "Siakol Album", artist: "Siakol", fileId: "12ESkQNJecr0-EXc1614D_SJkcLs5H-V8", isAlbum: true },
  { id: 9, title: "Kenny Rogers Album", artist: "Kenny Rogers", fileId: "12C12i7s68RqXTNtCHuT38BKc-4kn5Wix", isAlbum: true },
  { id: 10, title: "Gloc 9 Album", artist: "Gloc 9", fileId: "12UY470shY1auFLMhGLun6VrEJOtnn0Q7", isAlbum: true },
  { id: 11, title: "Rebulosyon Reggae Album", artist: "Rebulosyon Reggae", fileId: "12VGbpTwS_8QaA2D3KLf6e3f-a20WZf_y", isAlbum: true },
];

const BASE_PREVIEW_SONGS: Song[] = [
  { id: 9001, title: "On Bended Knee", artist: null, fileId: "1f7mDyykhIyzcRhBAOsnnJiteLL8rYLlg" },
];

const ADMIN_PASSWORD = "goldenboy";
const STORAGE_KEY = "giomier_admin_songs";
const PREVIEW_STORAGE_KEY = "giomier_preview_songs";
const COMMENTS_STORAGE_KEY = "giomier_comments";
const SONG_UNLOCK_STORAGE_KEY = "giomier_unlocked_song_id";
const OWNER_UNLOCK_CODE = "8316";
const MESSENGER_URL = "https://m.me/gioroames";
const CONTACT_PHONE = "09300820308";

const SEED_COMMENTS: Comment[] = [
  { id: 1, name: "Kuya Ronnie", text: "Ang ganda ng mga kanta dito! Sulit na sulit ang limang piso para sa buong album. Salamat Giomier!", rating: 5, date: "2026-07-28" },
  { id: 2, name: "Ate Marites", text: "Naalala ko pa nung bata pa ako sa mga kantang ito. Nakakaiyak! Maganda ang koleksyon mo pare.", rating: 5, date: "2026-07-30" },
  { id: 3, name: "Mang Carding", text: "Limang piso lang? Malaking tulong para sa isang magandang koleksyon. Dati pa ako nakikinig ng Siakol at Kenny Rogers.", rating: 5, date: "2026-08-01" },
  { id: 4, name: "Pinay_Lover22", text: "Ang sarap pakinggan habang nag-uulan. Lalo na yung Umiiyak ang Puso Ko.", rating: 5, date: "2026-08-02" },
  { id: 5, name: "Budz Manlapaz", text: "Sana dagdagan pa ng mga OPM classic. So far, napakaganda ng playlist. Keep it up boss!", rating: 4, date: "2026-08-03" },
];

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function extractFileId(input: string): string | null {
  const value = input.trim();
  if (/^[A-Za-z0-9_-]{20,35}$/.test(value)) return value;
  const match = value.match(/\/file\/d\/([A-Za-z0-9_-]{15,})/) ||
    value.match(/[?&]id=([A-Za-z0-9_-]{15,})/) ||
    value.match(/uc\?.*id=([A-Za-z0-9_-]{15,})/);
  return match?.[1] ?? null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fil-PH", { year: "numeric", month: "short", day: "numeric" });
}

function cleanText(text: string) {
  return text.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "").replace(/\s{2,}/g, " ").trim();
}

function readUnlockedSongId(): number | null {
  try {
    const raw = localStorage.getItem(SONG_UNLOCK_STORAGE_KEY);
    if (!raw) return null;
    const id = Number(raw);
    return Number.isInteger(id) ? id : null;
  } catch {
    return null;
  }
}

function driveDownload(song: Song) {
  window.open(`https://drive.google.com/uc?export=download&id=${song.fileId}`, "_blank", "noopener,noreferrer");
}

function Waveform() {
  return (
    <div className="flex h-12 items-end gap-1" aria-label="Sound waveform">
      {[18, 31, 12, 40, 24, 34, 48, 28, 15, 37, 22, 44, 30, 18, 38, 26, 47, 21, 34, 14, 29, 42, 24, 36].map((height, index) => (
        <span key={index} className="wave-bar w-1 rounded-full bg-primary" style={{ height: `${height}px` }} />
      ))}
    </div>
  );
}

function StepMarker({ number, active, complete }: { number: number; active: boolean; complete: boolean }) {
  return (
    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-colors ${complete ? "border-primary bg-primary text-primary-foreground" : active ? "border-accent bg-accent/15 text-accent" : "border-white/20 bg-white/5 text-muted-foreground"}`}>
      {complete ? <Check className="h-4 w-4" /> : number}
    </div>
  );
}

function NotFound() {
  return (
    <div className="page-shell flex min-h-[100dvh] items-center justify-center px-6 text-center">
      <div className="glass-card max-w-md rounded-3xl p-10">
        <Music className="mx-auto mb-4 h-10 w-10 text-primary" />
        <h1 className="font-display text-5xl text-foreground">Off the record</h1>
        <p className="mt-3 text-sm text-muted-foreground">Hindi namin makita ang page na ito.</p>
        <a href="/" className="mt-7 inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5" data-testid="link-back-home">
          Bumalik sa playlist <ChevronRight className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}

function VercelConnection() {
  const statusQuery = useGetVercelStatus({
    query: {
      queryKey: getGetVercelStatusQueryKey(),
      retry: 1,
      staleTime: 60_000,
    },
  });
  const healthQuery = useHealthCheck({
    query: {
      queryKey: getHealthCheckQueryKey(),
      retry: 1,
      staleTime: 60_000,
    },
  });
  const isLoading = statusQuery.isLoading || healthQuery.isLoading;
  const unavailable = statusQuery.isError || healthQuery.isError;
  const connected = Boolean(statusQuery.data?.connected) && !unavailable;
  const projectCount = statusQuery.data?.projectCount ?? 0;
  const checkedAt = statusQuery.data?.checkedAt;

  return (
    <div className="flex items-center gap-2 text-[10px] font-semibold tracking-wide text-muted-foreground" data-testid="status-vercel-connection">
      <span className={`relative flex h-2 w-2 shrink-0 rounded-full ${isLoading ? "bg-muted-foreground animate-pulse" : connected ? "bg-primary" : "bg-accent"}`} aria-hidden="true">
        {connected && <span className="absolute inset-[-3px] rounded-full border border-primary/30" />}
      </span>
      <span className="hidden sm:inline">
        {isLoading ? "Checking owner connection" : unavailable ? "Owner connection unavailable" : connected ? `Owner connection · ${projectCount} ${projectCount === 1 ? "project" : "projects"}` : "Owner connection paused"}
      </span>
      <span className="sm:hidden">{isLoading ? "Checking" : unavailable ? "Unavailable" : connected ? "Connected" : "Paused"}</span>
      {(unavailable || (!isLoading && !connected)) && (
        <button
          type="button"
          className="rounded-full border border-foreground/15 px-2 py-1 text-[9px] uppercase tracking-[.12em] text-foreground transition-colors hover:border-accent hover:text-accent"
          onClick={() => { void statusQuery.refetch(); void healthQuery.refetch(); }}
          data-testid="button-retry-vercel-connection"
        >
          Retry
        </button>
      )}
      {checkedAt && connected && <span className="hidden text-[9px] text-muted-foreground/70 md:inline">checked {formatDate(checkedAt)}</span>}
    </div>
  );
}

function Home() {
  const [adminSongs, setAdminSongs] = useState<Song[]>(() => readStorage(STORAGE_KEY, []));
  const [adminPreviewSongs, setAdminPreviewSongs] = useState<Song[]>(() => readStorage(PREVIEW_STORAGE_KEY, []));
  const [comments, setComments] = useState<Comment[]>(() => readStorage(COMMENTS_STORAGE_KEY, SEED_COMMENTS));
  const [searchQuery, setSearchQuery] = useState("");
  const [unlockedSongId, setUnlockedSongId] = useState<number | null>(() => readUnlockedSongId());
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [paymentName, setPaymentName] = useState("");
  const [paymentMobile, setPaymentMobile] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [requestCopied, setRequestCopied] = useState(false);
  const [messengerOpened, setMessengerOpened] = useState(false);
  const [unlockCode, setUnlockCode] = useState("");
  const [unlockError, setUnlockError] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [copyNotice, setCopyNotice] = useState("");
  const [favorite, setFavorite] = useState(false);
  const [notice, setNotice] = useState("");
  const [pwModalOpen, setPwModalOpen] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newArtist, setNewArtist] = useState("");
  const [newLink, setNewLink] = useState("");
  const [addError, setAddError] = useState("");
  const [addPreviewOpen, setAddPreviewOpen] = useState(false);
  const [pvTitle, setPvTitle] = useState("");
  const [pvArtist, setPvArtist] = useState("");
  const [pvLink, setPvLink] = useState("");
  const [pvError, setPvError] = useState("");
  const [cmtName, setCmtName] = useState("");
  const [cmtText, setCmtText] = useState("");
  const [cmtRating, setCmtRating] = useState(5);
  const [cmtError, setCmtError] = useState("");

  const allSongs = useMemo(() => [...BASE_SONGS, ...adminSongs], [adminSongs]);
  const previewSongs = useMemo(() => [...BASE_PREVIEW_SONGS, ...adminPreviewSongs], [adminPreviewSongs]);
  const filteredSongs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return allSongs;
    return allSongs.filter((song) => song.title.toLowerCase().includes(query) || (song.artist ?? "").toLowerCase().includes(query));
  }, [allSongs, searchQuery]);

  useEffect(() => {
    document.body.style.overflow = downloadModalOpen || pwModalOpen || addModalOpen || addPreviewOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [downloadModalOpen, pwModalOpen, addModalOpen, addPreviewOpen]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 2800);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const resetDownloadForm = () => {
    setPaymentName("");
    setPaymentMobile("");
    setPaymentReference("");
    setRequestCopied(false);
    setMessengerOpened(false);
    setUnlockCode("");
    setUnlockError("");
    setPaymentError("");
    setCopyNotice("");
  };

  const handleDownloadClick = (song: Song) => {
    if (song.isAlbum) {
      setNotice("Album entry ito. Singles lang ang available para sa download.");
      return;
    }
    if (unlockedSongId === song.id) {
      driveDownload(song);
      return;
    }
    if (unlockedSongId !== null) {
      setNotice("Isang kanta lang ang puwedeng i-unlock gamit ang code na ito.");
      return;
    }
    setSelectedSong(song);
    resetDownloadForm();
    setDownloadModalOpen(true);
  };

  const requestDetails = `Giomier's Playlist — ₱5 PayMaya request\nPayment name: ${paymentName.trim()}\nMobile number: ${paymentMobile.trim()}\nPayMaya reference number: ${paymentReference.trim()}`;

  const validPaymentDetails = paymentName.trim() && paymentMobile.trim() && paymentReference.trim();
  const handleCopyRequest = async () => {
    if (!validPaymentDetails) {
      setPaymentError("Kumpletuhin muna ang tatlong payment details.");
      return;
    }
    try {
      await navigator.clipboard.writeText(requestDetails);
    } catch {
      const helper = document.createElement("textarea");
      helper.value = requestDetails;
      document.body.appendChild(helper);
      helper.select();
      document.execCommand("copy");
      helper.remove();
    }
    setRequestCopied(true);
    setPaymentError("");
    setCopyNotice("Nakopya na ang request details.");
  };

  const handleOpenMessenger = () => {
    if (!requestCopied) {
      setPaymentError("I-copy muna ang request details bago pumunta sa Messenger.");
      return;
    }
    const ref = encodeURIComponent("giomier-paymaya-request");
    window.open(`${MESSENGER_URL}?ref=${ref}`, "_blank", "noopener,noreferrer");
    setMessengerOpened(true);
    setCopyNotice("Messenger opened. Hintayin ang manual verification ng owner.");
  };

  const handleUnlock = (event: React.FormEvent) => {
    event.preventDefault();
    const code = unlockCode.trim();
    if (!messengerOpened) {
      setUnlockError("Buksan muna ang Messenger at ipadala ang request details.");
      return;
    }
    if (!/^[0-9]{4,8}$/.test(code)) {
      setUnlockError("Ilagay ang 4–8 digit na code na ipinadala mismo ng owner.");
      return;
    }
    if (code !== OWNER_UNLOCK_CODE) {
      setUnlockError("Maling unlock code. Hindi nabuksan ang piniling kanta.");
      return;
    }
    if (!selectedSong) {
      setUnlockError("Pumili muna ng isang kanta na bubuksan.");
      return;
    }
    if (selectedSong.isAlbum) {
      setUnlockError("Singles lang ang puwedeng i-unlock. Hindi available ang album entry.");
      return;
    }
    if (unlockedSongId !== null && unlockedSongId !== selectedSong.id) {
      setUnlockError("Nagamit na ang code na ito para sa ibang kanta. Isang kanta lang ang puwedeng i-unlock.");
      return;
    }
    const songToDownload = selectedSong;
    setUnlockedSongId(songToDownload.id);
    localStorage.setItem(SONG_UNLOCK_STORAGE_KEY, String(songToDownload.id));
    setDownloadModalOpen(false);
    setNotice(`Na-unlock ang "${songToDownload.title}" lang.`);
    driveDownload(songToDownload);
    setSelectedSong(null);
  };

  const handlePlayClick = () => {
    if (isAdmin) {
      setAddModalOpen(true);
      return;
    }
    setPwInput("");
    setPwError("");
    setPwModalOpen(true);
  };

  const handlePasswordSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (pwInput === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setPwModalOpen(false);
      setAddModalOpen(true);
    } else {
      setPwError("Incorrect password. Try again.");
    }
  };

  const handleAddSong = (event: React.FormEvent) => {
    event.preventDefault();
    if (!newTitle.trim() || !newLink.trim()) {
      setAddError("Kailangan ang title at Google Drive link.");
      return;
    }
    const fileId = extractFileId(newLink);
    if (!fileId) {
      setAddError("Hindi ma-extract ang Google Drive file ID mula sa link.");
      return;
    }
    const next = [...adminSongs, { id: Date.now(), title: newTitle.trim(), artist: newArtist.trim() || null, fileId, isAdmin: true }];
    setAdminSongs(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setNewTitle(""); setNewArtist(""); setNewLink(""); setAddError(""); setAddModalOpen(false);
    setNotice("Naidagdag ang kanta sa playlist.");
  };

  const handleAddPreview = (event: React.FormEvent) => {
    event.preventDefault();
    const fileId = extractFileId(pvLink);
    if (!pvTitle.trim() || !fileId) {
      setPvError("Ilagay ang title at isang valid na Google Drive link.");
      return;
    }
    const next = [...adminPreviewSongs, { id: Date.now(), title: pvTitle.trim(), artist: pvArtist.trim() || null, fileId, isAdmin: true }];
    setAdminPreviewSongs(next);
    localStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(next));
    setPvTitle(""); setPvArtist(""); setPvLink(""); setPvError(""); setAddPreviewOpen(false);
    setNotice("Naidagdag ang bagong preview.");
  };

  const handleAddComment = (event: React.FormEvent) => {
    event.preventDefault();
    if (!cmtName.trim() || !cmtText.trim()) {
      setCmtError("Ilagay ang pangalan at komento bago mag-post.");
      return;
    }
    const next = [{ id: Date.now(), name: cleanText(cmtName), text: cleanText(cmtText), rating: cmtRating, date: new Date().toISOString().slice(0, 10) }, ...comments];
    setComments(next);
    localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify(next));
    setCmtName(""); setCmtText(""); setCmtRating(5); setCmtError(""); setNotice("Nai-post na ang iyong komento.");
  };

  const removeSong = (id: number) => {
    const next = adminSongs.filter((song) => song.id !== id);
    setAdminSongs(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const removePreview = (id: number) => {
    const next = adminPreviewSongs.filter((song) => song.id !== id);
    setAdminPreviewSongs(next);
    localStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(next));
  };

  return (
    <div className="page-shell grain min-h-[100dvh] w-full overflow-hidden text-foreground selection:bg-primary/25">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <a href="/" className="flex items-center gap-3" data-testid="link-brand">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary"><Headphones className="h-5 w-5" /></span>
          <span><span className="block text-[10px] font-bold uppercase tracking-[.24em] text-primary">Personal collection</span><span className="font-display text-xl leading-none text-foreground">Giomier's Playlist</span></span>
        </a>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="hidden items-center gap-2 sm:flex"><span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_0_4px_rgba(134,167,48,.14)]" /> Owner-curated</span>
          <span className="hidden h-4 w-px bg-white/10 sm:block" />
           <span className="hidden sm:block">11 songs · ₱5 selected-track access</span>
          <VercelConnection />
          <button onClick={handlePlayClick} className="inline-flex h-9 items-center gap-2 rounded-full border border-foreground/15 px-3 text-[11px] font-bold text-foreground transition-colors hover:border-accent/50 hover:text-accent" title="Owner access" data-testid="button-owner-access"><Lock className="h-3.5 w-3.5" /> Owner</button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-5 pb-20 pt-5 sm:px-8 md:gap-16 md:pt-12">
        <section className="reveal grid items-end gap-10 md:grid-cols-[1.08fr_.92fr]">
          <div>
            <div className="mb-6 flex items-center gap-3 text-xs font-bold uppercase tracking-[.2em] text-primary"><span className="h-px w-10 bg-primary" /> A small archive of big feelings</div>
            <h1 className="max-w-3xl font-display text-[4.35rem] leading-[.82] tracking-[-.035em] text-foreground sm:text-8xl md:text-[7.2rem]">Songs that<br /><em className="text-primary">stay with you.</em></h1>
             <p className="mt-8 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">A personal shelf of OPM, classic pop, reggae, and songs for the long ride home. Listen to a free preview, then unlock one selected track for just <strong className="font-semibold text-accent">₱5 via PayMaya.</strong></p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a href="#songs" className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground shadow-[0_12px_28px_rgba(88,213,177,.2)] transition-transform hover:-translate-y-1" data-testid="link-browse-songs">Browse the collection <ChevronRight className="h-4 w-4" /></a>
              <a href="#preview" className="inline-flex h-12 items-center gap-2 rounded-full border border-foreground/20 px-5 text-sm font-semibold text-foreground transition-colors hover:border-primary/50 hover:text-primary" data-testid="link-free-preview">Hear the free preview</a>
            </div>
          </div>
          <div className="reveal reveal-delay-2 relative min-h-[250px] overflow-hidden rounded-[2rem] border border-primary/20 bg-[#142b3a] p-6 shadow-2xl sm:min-h-[310px] md:min-h-[365px]">
            <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full border border-primary/20" /><div className="absolute -right-3 -top-7 h-40 w-40 rounded-full border border-primary/20" /><div className="absolute bottom-0 left-0 h-36 w-36 rounded-full bg-primary/10 blur-3xl" />
            <div className="relative flex h-full min-h-[215px] flex-col justify-between sm:min-h-[275px] md:min-h-[330px]">
              <div className="flex items-start justify-between"><span className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-primary">Side A / 2026</span><Mic2 className="h-5 w-5 text-accent" /></div>
              <div><Waveform /><p className="mt-5 max-w-xs font-display text-3xl leading-none text-foreground sm:text-4xl">Press play on a memory.</p></div>
              <div className="flex items-center justify-between border-t border-white/10 pt-4 text-[11px] text-muted-foreground"><span>Curated by giomier aremos</span><span className="font-mono-ui text-primary">01—11</span></div>
            </div>
          </div>
        </section>

        <section className="reveal reveal-delay-1 grid gap-3 border-y border-foreground/10 py-5 sm:grid-cols-3">
           {[{ label: "The shelf", value: `${allSongs.length} tracks`, note: "OPM, classics, and albums", icon: Music }, { label: "The first listen", value: "Free preview", note: "Try the chorus before you decide", icon: Radio }, { label: "The little unlock", value: "₱5 per track", note: "One code unlocks one selected song", icon: ShieldCheck }].map(({ label, value, note, icon: Icon }) => (
            <div className="flex items-center gap-3 px-2 py-2 sm:px-4" key={label}><Icon className="h-5 w-5 shrink-0 text-primary" /><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-muted-foreground">{label}</p><p className="mt-1 text-sm font-bold text-foreground">{value}</p><p className="mt-0.5 text-xs text-muted-foreground">{note}</p></div></div>
          ))}
        </section>

        <section id="preview" className="scroll-mt-8">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-primary">Start here</p><h2 className="mt-1 font-display text-4xl text-foreground">A free taste</h2></div><span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">No payment needed</span></div>
          <div className="glass-card overflow-hidden rounded-3xl">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-5 py-5 sm:px-7"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary"><Radio className="h-5 w-5" /></span><div><h3 className="text-sm font-bold text-foreground">Free chorus preview</h3><p className="mt-0.5 text-xs text-muted-foreground">Listen first. The full files stay behind the ₱5 unlock.</p></div></div>{isAdmin && <button onClick={() => setAddPreviewOpen(true)} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-4 text-xs font-bold text-primary transition-colors hover:bg-primary/20" data-testid="button-add-preview"><Plus className="h-3.5 w-3.5" /> Add preview</button>}</div>
            <div className="space-y-3 p-4 sm:p-6">
              {previewSongs.length === 0 && <div className="rounded-2xl border border-dashed border-white/15 py-12 text-center"><Radio className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><p className="text-sm text-muted-foreground">Wala pang preview. Abangan ang susunod na upload.</p></div>}
               {previewSongs.map((song, index) => <div key={song.id} className="rounded-2xl border border-foreground/10 bg-secondary p-4" data-testid={`card-preview-${song.id}`}><div className="mb-3 flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><span className="font-mono-ui text-xs text-primary/70">{String(index + 1).padStart(2, "0")}</span><div className="min-w-0"><p className="truncate text-sm font-bold text-secondary-foreground">{song.title}</p>{song.artist && <p className="truncate text-xs text-secondary-foreground/70">{song.artist}</p>}</div></div><div className="flex items-center gap-2"><span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">Chorus</span>{isAdmin && song.isAdmin && <button onClick={() => removePreview(song.id)} className="rounded-full p-1.5 text-destructive transition-colors hover:bg-destructive/10" title="Tanggalin preview" data-testid={`button-delete-preview-${song.id}`}><Trash2 className="h-3.5 w-3.5" /></button>}</div></div><div className="h-12 overflow-hidden rounded-xl border border-secondary-foreground/10 bg-foreground"><iframe src={`https://drive.google.com/file/d/${song.fileId}/preview`} className="h-full w-full border-0" allow="autoplay" title={`Preview: ${song.title}`} sandbox="allow-scripts allow-same-origin allow-popups" /></div></div>)}
            </div>
          </div>
        </section>

        <section id="songs" className="scroll-mt-8">
          <div className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-primary">The collection</p><h2 className="mt-1 font-display text-4xl text-foreground">Pick a track</h2><p className="mt-2 text-sm text-muted-foreground">Unlock once, download every song in this browser.</p></div><div className="relative w-full sm:w-72"><Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input type="search" className="search-input" placeholder="Search title or artist" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} data-testid="input-search-songs" /></div></div>
          <div className="mb-3 grid grid-cols-[36px_1fr_auto] gap-4 px-4 text-[10px] font-bold uppercase tracking-[.16em] text-muted-foreground sm:grid-cols-[44px_1fr_auto]"><span>#</span><span>Title</span><span className="pr-2">Access</span></div>
             <div className="space-y-2">
            {filteredSongs.length === 0 && <div className="glass-card rounded-3xl border-dashed py-16 text-center"><Search className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><p className="text-sm font-semibold text-foreground">Walang nahanap na kanta</p><p className="mt-1 text-xs text-muted-foreground">Subukan ang ibang title o artist.</p><button onClick={() => setSearchQuery("")} className="mt-5 text-xs font-bold text-primary hover:underline" data-testid="button-clear-search">Clear search</button></div>}
             {filteredSongs.map((song, index) => {
               const songUnlocked = unlockedSongId === song.id;
               const anotherSongUnlocked = unlockedSongId !== null && !songUnlocked;
               const albumSong = song.isAlbum === true;
               const unavailable = albumSong || anotherSongUnlocked;
               return <div key={song.id} className={`glass-card grid grid-cols-[36px_1fr] items-center gap-3 rounded-2xl p-3 sm:grid-cols-[44px_1fr_auto] sm:gap-4 sm:p-4 ${unavailable ? "opacity-60" : ""}`} data-testid={`card-song-${song.id}`}><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 font-mono-ui text-xs text-muted-foreground">{String(index + 1).padStart(2, "0")}</div><div className="min-w-0"><div className="flex flex-wrap items-center gap-x-2 gap-y-1"><span className="truncate text-sm font-bold text-foreground sm:text-base">{song.title}</span>{albumSong && <span className="rounded border border-foreground/15 bg-foreground/5 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-muted-foreground">Album locked</span>}{song.isAdmin && <span className="rounded border border-accent/30 bg-accent/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-accent">Added</span>}</div><p className="mt-1 truncate text-xs text-muted-foreground">{song.artist ?? "Personal archive"}</p>{isAdmin && <div className="mt-3 h-16 overflow-hidden rounded-xl border border-white/10 bg-[#091723]"><iframe src={`https://drive.google.com/file/d/${song.fileId}/preview`} className="h-full w-full border-0" allow="autoplay" title={`Admin preview: ${song.title}`} sandbox="allow-scripts allow-same-origin allow-popups" /></div>}</div><div className="col-span-2 flex items-center justify-end gap-2 sm:col-span-1">{isAdmin && song.isAdmin && <button onClick={() => removeSong(song.id)} className="rounded-full p-2 text-destructive transition-colors hover:bg-destructive/10" title="Remove song" data-testid={`button-delete-song-${song.id}`}><Trash2 className="h-4 w-4" /></button>}<button onClick={() => handleDownloadClick(song)} disabled={unavailable} className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-xs font-bold transition-transform sm:px-5 sm:text-sm ${songUnlocked ? "bg-primary text-primary-foreground hover:-translate-y-0.5" : unavailable ? "cursor-not-allowed border border-foreground/15 bg-transparent text-muted-foreground" : "bg-primary text-primary-foreground hover:-translate-y-0.5"}`} data-testid={`button-download-song-${song.id}`}>{songUnlocked ? <Download className="h-4 w-4" /> : <Lock className="h-4 w-4" />}{songUnlocked ? "Download selected" : albumSong ? "Single songs only" : anotherSongUnlocked ? "Locked" : "Unlock this song"}</button></div></div>;
             })}
          </div>
           <div className="mt-5 flex items-start gap-2 rounded-2xl border border-accent/20 bg-accent/5 p-4 text-xs leading-5 text-muted-foreground"><Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" /><p>Singles lang ang available para sa download. One ₱5 payment and code 8316 unlock only the selected single in this browser; album entries stay locked.</p></div>
        </section>

         <section className="grid gap-8 border-t border-foreground/10 pt-12 md:grid-cols-[.8fr_1.2fr]">
          <div><p className="text-xs font-bold uppercase tracking-[.18em] text-primary">From listeners</p><h2 className="mt-1 font-display text-4xl text-foreground">The guestbook</h2><p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">May kanta para sa bawat memory. Iwan ang iyong note para sa susunod na makikinig.</p><div className="mt-7 flex items-center gap-2 text-accent"><div className="flex">{[1, 2, 3, 4, 5].map((item) => <Star key={item} className="h-4 w-4 fill-accent" />)}</div><span className="text-xs font-semibold text-muted-foreground">Shared with care</span></div></div>
           <div className="space-y-5"><form onSubmit={handleAddComment} className="glass-card rounded-3xl p-5 sm:p-6" data-testid="form-comment"><div className="mb-4 flex items-center justify-between"><h3 className="text-sm font-bold text-foreground">Mag-iwan ng komento</h3><div className="flex gap-0.5" aria-label="Choose rating">{[1, 2, 3, 4, 5].map((rating) => <button type="button" key={rating} onClick={() => setCmtRating(rating)} className="rounded p-0.5" aria-label={`${rating} stars`} data-testid={`button-rating-${rating}`}><Star className={`h-4 w-4 transition-colors ${rating <= cmtRating ? "fill-accent text-accent" : "text-muted-foreground"}`} /></button>)}</div></div><div className="grid gap-3 sm:grid-cols-[.7fr_1.3fr]"><input className="admin-input" value={cmtName} onChange={(event) => { setCmtName(event.target.value); setCmtError(""); }} placeholder="Pangalan mo" maxLength={40} data-testid="input-comment-name" /><textarea className="admin-input min-h-12 resize-none" value={cmtText} onChange={(event) => { setCmtText(event.target.value); setCmtError(""); }} placeholder="Ano ang masasabi mo sa playlist?" rows={2} maxLength={300} data-testid="input-comment-text" /></div>{cmtError && <p className="mt-3 flex items-center gap-1 text-xs text-destructive"><X className="h-3.5 w-3.5" />{cmtError}</p>}<div className="mt-4 flex justify-end"><button type="submit" className="inline-flex h-10 items-center gap-2 rounded-full bg-accent px-5 text-xs font-bold text-accent-foreground transition-transform hover:-translate-y-0.5" data-testid="button-submit-comment"><Send className="h-3.5 w-3.5" /> Post note</button></div></form><div className="space-y-3">{comments.length === 0 && <div className="rounded-2xl border border-dashed border-foreground/15 py-10 text-center text-sm text-muted-foreground">Wala pang notes. Ikaw ang mauna.</div>}{comments.map((comment) => <article key={comment.id} className="glass-card rounded-2xl p-4" data-testid={`card-comment-${comment.id}`}><div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary"><User className="h-4 w-4" /></span><div><p className="flex items-center gap-1 text-sm font-bold text-foreground">{cleanText(comment.name)} <BadgeCheck className="h-3.5 w-3.5 text-primary" /></p><p className="text-[11px] text-muted-foreground">{formatDate(comment.date)}</p></div></div><div className="flex gap-0.5">{[1, 2, 3, 4, 5].map((rating) => <Star key={rating} className={`h-3.5 w-3.5 ${rating <= comment.rating ? "fill-accent text-accent" : "text-muted-foreground/30"}`} />)}</div></div><p className="mt-3 pl-12 text-sm leading-6 text-foreground/75">{cleanText(comment.text)}</p></article>)}</div></div>
        </section>

        <footer className="flex flex-col gap-5 border-t border-foreground/10 pt-7 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><p className="flex items-center gap-2"><Headphones className="h-4 w-4 text-primary" /> Giomier's Playlist · made for the next listen</p><div className="flex flex-wrap items-center gap-4"><VercelConnection /><span className="hidden h-3 w-px bg-foreground/15 sm:block" /><button onClick={() => setFavorite((value) => !value)} className={`flex items-center gap-1.5 transition-colors ${favorite ? "text-accent" : "hover:text-foreground"}`} data-testid="button-footer-favorite"><Heart className={`h-3.5 w-3.5 ${favorite ? "fill-accent" : ""}`} /> {favorite ? "Saved" : "Save playlist"}</button></div></footer>
      </main>

      {isAdmin && <div className="fixed bottom-5 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full border border-accent/30 bg-[#182d3c]/95 px-3 py-2 text-xs font-semibold text-accent shadow-xl backdrop-blur-md"><ShieldCheck className="h-4 w-4" /> Admin mode <button onClick={() => setIsAdmin(false)} className="ml-1 rounded-full px-2 py-1 text-[10px] text-muted-foreground hover:bg-white/10 hover:text-foreground" data-testid="button-lock-admin">Lock</button></div>}

      {notice && <div className="fixed bottom-5 right-5 z-40 flex max-w-xs items-center gap-2 rounded-2xl border border-primary/30 bg-[#183646] px-4 py-3 text-xs font-semibold text-primary shadow-2xl" role="status" data-testid="status-notice"><Check className="h-4 w-4 shrink-0" />{notice}</div>}

      <Dialog.Root open={downloadModalOpen} onOpenChange={setDownloadModalOpen}>
        <Dialog.Portal><Dialog.Overlay className="modal-overlay" /><Dialog.Content className="modal-content p-5 text-foreground sm:p-7">
           <div className="mb-5 flex items-start justify-between gap-4"><div><Dialog.Title className="flex items-center gap-2 text-xl font-bold"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary"><Lock className="h-4 w-4" /></span>Unlock the selected song</Dialog.Title><Dialog.Description className="mt-2 text-xs leading-5 text-muted-foreground">Pay ₱5 via PayMaya, send the details to the owner, then enter code 8316. This unlocks the selected song only—not the album.</Dialog.Description></div><Dialog.Close className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground" data-testid="button-close-download-modal"><X className="h-5 w-5" /></Dialog.Close></div>
          <div className="mb-6 grid grid-cols-3 gap-1">{[{ n: 1, label: "Pay" }, { n: 2, label: "Message" }, { n: 3, label: "Unlock" }].map(({ n, label }) => <div key={n} className={`border-b-2 pb-2 text-center text-[10px] font-bold uppercase tracking-wider transition-colors ${n === 1 && !requestCopied ? "border-accent text-accent" : n === 2 && requestCopied && !messengerOpened ? "border-accent text-accent" : n === 3 && messengerOpened ? "border-accent text-accent" : "border-white/10 text-muted-foreground"}`}>{label}</div>)}</div>
          {selectedSong && <div className="mb-4 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-muted-foreground"><Music className="h-3.5 w-3.5 text-primary" /> Download after unlock: <strong className="text-foreground">{selectedSong.title}</strong></div>}
          <div className="space-y-5">
            <div className={`flex gap-3 ${requestCopied ? "opacity-70" : ""}`}><StepMarker number={1} active={!requestCopied} complete={Boolean(requestCopied)} /><div className="min-w-0 flex-1"><h3 className="text-sm font-bold">Pay ₱5 via PayMaya</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">Send exactly ₱5 to the PayMaya details provided by the owner in Messenger. This site does not verify payments automatically.</p><div className="mt-3 grid gap-3 sm:grid-cols-3"><label className="text-[11px] font-semibold text-muted-foreground">Payment name<input className="admin-input mt-1.5 text-xs" value={paymentName} onChange={(event) => { setPaymentName(event.target.value); setRequestCopied(false); setPaymentError(""); }} placeholder="Name used to pay" data-testid="input-payment-name" /></label><label className="text-[11px] font-semibold text-muted-foreground">Mobile number<input className="admin-input mt-1.5 text-xs" value={paymentMobile} onChange={(event) => { setPaymentMobile(event.target.value); setRequestCopied(false); setPaymentError(""); }} placeholder="09xx xxx xxxx" inputMode="tel" data-testid="input-payment-mobile" /></label><label className="text-[11px] font-semibold text-muted-foreground">PayMaya reference<input className="admin-input mt-1.5 text-xs" value={paymentReference} onChange={(event) => { setPaymentReference(event.target.value); setRequestCopied(false); setPaymentError(""); }} placeholder="Reference number" data-testid="input-payment-reference" /></label></div><button onClick={handleCopyRequest} className="mt-3 inline-flex h-10 items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 text-xs font-bold text-primary transition-colors hover:bg-primary/20" data-testid="button-copy-payment-request">{requestCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{requestCopied ? "Request copied" : "Copy request details"}</button>{paymentError && <p className="mt-2 flex items-center gap-1 text-xs text-destructive"><X className="h-3.5 w-3.5" />{paymentError}</p>}{copyNotice && <p className="mt-2 flex items-center gap-1 text-xs text-primary"><Clipboard className="h-3.5 w-3.5" />{copyNotice}</p>}</div></div>
            <div className={`flex gap-3 ${!requestCopied ? "opacity-45" : ""}`}><StepMarker number={2} active={requestCopied && !messengerOpened} complete={messengerOpened} /><div className="min-w-0 flex-1"><h3 className="text-sm font-bold">Send the request in Messenger</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">Paste the copied details into the existing Messenger chat with Giomier. Include proof of your ₱5 PayMaya payment there.</p><button onClick={handleOpenMessenger} disabled={!requestCopied} className="mt-3 inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-xs font-bold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40" data-testid="button-open-messenger"><MessageCircle className="h-4 w-4" /> Open Giomier's Messenger</button></div></div>
             <div className={`flex gap-3 ${!messengerOpened ? "opacity-45" : ""}`}><StepMarker number={3} active={messengerOpened} complete={unlockedSongId === selectedSong?.id} /><div className="min-w-0 flex-1"><h3 className="text-sm font-bold">Enter code 8316 for this song</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">After payment verification, enter the owner code. It can unlock only the selected song.</p><form onSubmit={handleUnlock} className="mt-3 flex gap-2"><input className="admin-input text-center font-mono-ui text-sm tracking-[.2em]" value={unlockCode} onChange={(event) => { setUnlockCode(event.target.value.replace(/\D/g, "")); setUnlockError(""); }} maxLength={8} inputMode="numeric" placeholder="8316" disabled={!messengerOpened} data-testid="input-unlock-code" /><button type="submit" disabled={!messengerOpened} className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-accent px-4 text-xs font-bold text-accent-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40" data-testid="button-submit-unlock"><Unlock className="h-4 w-4" /><span className="hidden sm:inline">Unlock selected</span></button></form>{unlockError && <p className="mt-2 flex items-center gap-1 text-xs text-destructive"><X className="h-3.5 w-3.5" />{unlockError}</p>}</div></div>
          </div>
          <div className="mt-6 flex items-start gap-2 border-t border-white/10 pt-4 text-[11px] leading-5 text-muted-foreground"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /><p>Your payment details stay in this local form until you copy them. Access is unlocked only after the owner manually checks your payment and sends a code.</p></div>
        </Dialog.Content></Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={pwModalOpen} onOpenChange={setPwModalOpen}><Dialog.Portal><Dialog.Overlay className="modal-overlay" /><Dialog.Content className="modal-content p-6 text-foreground sm:p-7"><div className="flex items-start justify-between"><div><Dialog.Title className="flex items-center gap-2 text-xl font-bold"><ShieldCheck className="h-5 w-5 text-accent" /> Admin access</Dialog.Title><Dialog.Description className="mt-2 text-sm text-muted-foreground">Playlist management is reserved for the owner.</Dialog.Description></div><Dialog.Close className="rounded-full p-2 text-muted-foreground hover:bg-white/10" data-testid="button-close-password-modal"><X className="h-5 w-5" /></Dialog.Close></div><form onSubmit={handlePasswordSubmit} className="mt-6 space-y-4"><input type="password" className="admin-input" value={pwInput} onChange={(event) => { setPwInput(event.target.value); setPwError(""); }} placeholder="Enter password" autoFocus data-testid="input-admin-password" />{pwError && <p className="text-xs text-destructive">{pwError}</p>}<button type="submit" className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-accent text-sm font-bold text-accent-foreground" data-testid="button-submit-admin"><Unlock className="h-4 w-4" /> Unlock admin</button></form></Dialog.Content></Dialog.Portal></Dialog.Root>

      <Dialog.Root open={addPreviewOpen} onOpenChange={setAddPreviewOpen}><Dialog.Portal><Dialog.Overlay className="modal-overlay" /><Dialog.Content className="modal-content p-6 text-foreground sm:p-7"><div className="flex items-start justify-between"><Dialog.Title className="flex items-center gap-2 text-xl font-bold"><Radio className="h-5 w-5 text-primary" /> Add a free preview</Dialog.Title><Dialog.Close className="rounded-full p-2 text-muted-foreground hover:bg-white/10" data-testid="button-close-preview-modal"><X className="h-5 w-5" /></Dialog.Close></div><form onSubmit={handleAddPreview} className="mt-6 space-y-4"><label className="block text-xs font-semibold text-muted-foreground">Song title<input className="admin-input mt-1.5" value={pvTitle} onChange={(event) => setPvTitle(event.target.value)} placeholder="Title" data-testid="input-preview-title" /></label><label className="block text-xs font-semibold text-muted-foreground">Artist<input className="admin-input mt-1.5" value={pvArtist} onChange={(event) => setPvArtist(event.target.value)} placeholder="Artist (optional)" data-testid="input-preview-artist" /></label><label className="block text-xs font-semibold text-muted-foreground">Google Drive link<input className="admin-input mt-1.5" value={pvLink} onChange={(event) => setPvLink(event.target.value)} placeholder="Paste a share link" data-testid="input-preview-link" /></label>{pvError && <p className="text-xs text-destructive">{pvError}</p>}<button type="submit" className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-bold text-primary-foreground" data-testid="button-submit-preview"><Plus className="h-4 w-4" /> Add preview</button></form></Dialog.Content></Dialog.Portal></Dialog.Root>

      <Dialog.Root open={addModalOpen} onOpenChange={setAddModalOpen}><Dialog.Portal><Dialog.Overlay className="modal-overlay" /><Dialog.Content className="modal-content p-6 text-foreground sm:p-7"><div className="flex items-start justify-between"><Dialog.Title className="flex items-center gap-2 text-xl font-bold"><Plus className="h-5 w-5 text-accent" /> Add to playlist</Dialog.Title><Dialog.Close className="rounded-full p-2 text-muted-foreground hover:bg-white/10" data-testid="button-close-add-modal"><X className="h-5 w-5" /></Dialog.Close></div><form onSubmit={handleAddSong} className="mt-6 space-y-4"><label className="block text-xs font-semibold text-muted-foreground">Song title<input className="admin-input mt-1.5" value={newTitle} onChange={(event) => setNewTitle(event.target.value)} placeholder="Song title" data-testid="input-song-title" /></label><label className="block text-xs font-semibold text-muted-foreground">Artist<input className="admin-input mt-1.5" value={newArtist} onChange={(event) => setNewArtist(event.target.value)} placeholder="Artist (optional)" data-testid="input-song-artist" /></label><label className="block text-xs font-semibold text-muted-foreground">Google Drive link<input className="admin-input mt-1.5" value={newLink} onChange={(event) => setNewLink(event.target.value)} placeholder="Paste a share link" data-testid="input-song-link" /></label>{addError && <p className="text-xs text-destructive">{addError}</p>}<button type="submit" className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-accent text-sm font-bold text-accent-foreground" data-testid="button-submit-song"><Plus className="h-4 w-4" /> Add song</button></form></Dialog.Content></Dialog.Portal></Dialog.Root>

    </div>
  );
}

function App() {
  return <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, "") || ""}><Switch><Route path="/" component={Home} /><Route component={NotFound} /></Switch></WouterRouter>;
}

export default App;