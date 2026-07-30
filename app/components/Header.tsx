"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { calcularPrecoVenda } from "@/app/lib/pricing";
import { FaWhatsapp, FaInstagram } from "react-icons/fa";
import { HiOutlineLocationMarker } from "react-icons/hi";
import { FiShoppingCart } from "react-icons/fi";
import { FaUserCircle } from "react-icons/fa";
import { FiSearch } from "react-icons/fi";
import s from "@/app/styles/header.module.css";
import { ROUTES } from "@/routes/routes";


export default function Header() {
  const [cartCount, setCartCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const [openMobile, setOpenMobile] = useState(false);
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [history, setHistory] = useState<string[]>([]);

  const [showSearchBox, setShowSearchBox] = useState(false); // NOVO

  const searchRef = useRef<HTMLDivElement>(null);
  const [openUserMenu, setOpenUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const menu = [
    { label: "Loja", href: "/" },
    { label: "Projetos", href: ROUTES.projetos },
    { label: "Data center", href: ROUTES.categoria("data-center") },
    { label: "Sistema de Segurança", href: ROUTES.categoria("sistema-de-seguranca") },
    { label: "Instalação", href: ROUTES.instalacao },
    { label: "Fale conosco", href: ROUTES.faleConosco },
    { label: "Quem somos", href: ROUTES.quemSomos },
  ];

async function fetchCartCount() {

  const res = await fetch("/api/cart", {
    credentials: "include",
  });

  // 👤 Visitante
  if (res.status === 401) {

    const cart = JSON.parse(
      localStorage.getItem("cart") || "[]"
    );

    const total = cart.reduce(
      (acc: number, item: any) => acc + item.qty,
      0
    );

    setCartCount(total);

    return;
  }

  // 👤 Logado
  const data = await res.json();

  if (Array.isArray(data)) {

    const total = data.reduce(
      (acc: number, item: any) => acc + item.qty,
      0
    );

    setCartCount(total);

  } else {

    setCartCount(0);

  }

}

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/me");

        if (!res.ok) {
          setUser(null);
          return;
        }

        const data = await res.json();
        setUser(data);
      } catch {
        setUser(null);
      } finally {
        setLoadingUser(false);
      }
    }

    fetchUser();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: any) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setOpenUserMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchCartCount();

    function updateCart() {
      fetchCartCount();
    }

    window.addEventListener("cartUpdated", updateCart);

    return () => {
      window.removeEventListener("cartUpdated", updateCart);
    };
  }, []);

  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(href + "/");

  // ===== HISTÓRICO LOCAL =====
  useEffect(() => {
    const stored = localStorage.getItem("search_history");
    if (stored) {
      setHistory(JSON.parse(stored));
    }
  }, []);

  function saveHistory(term: string) {
    const updated = [term, ...history.filter((h) => h !== term)].slice(0, 5);
    setHistory(updated);
    localStorage.setItem("search_history", JSON.stringify(updated));
  }

  function buscar(e: any) {
    e.preventDefault();
    if (!search) return;

    saveHistory(search);
    setSuggestions([]);
    router.push("/loja?q=" + search);
  }

  // ===== AUTOCOMPLETE =====
  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (search.length < 2) {
        setSuggestions([]);
        return;
      }

      setLoading(true);

      const res = await fetch("/api/search/suggest?q=" + search);
      const data = await res.json();

      setSuggestions(data);
      setSelectedIndex(-1);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [search]);

  // ===== FECHAR AO CLICAR FORA =====
  useEffect(() => {
    function handleClickOutside(e: any) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSuggestions([]);
        setShowSearchBox(false); // NOVO
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/";
  }

  // ===== DESTACAR TEXTO =====
  function highlight(text: string) {
    const regex = new RegExp(`(${search})`, "gi");
    return text.replace(regex, "<strong>$1</strong>");
  }

  if (!mounted) {
    return null;
  }

  return (
    <header className={s.header}>
      <div className={s.wrap}>
        <div className={s.top}>
          {/* Logo */}
          <Link href={ROUTES.home} className={s.brand}>
            <img src="/produtos/logo.png" alt="Lima e Lima" className={s.logo} />
          </Link>

          <div className={s.mobileBtn}>
            <button
              className={s.mobileToggle}
              onClick={() => setOpenMobile(!openMobile)}
            >
              ☰ Menu
            </button>
          </div>

          {/* ===== BUSCA ===== */}
          <div
  className={s.search}
  ref={searchRef}
  style={{
    position: "relative",
    zIndex: 999999,
  }}
>
            <div className={s.searchWrapper} ref={searchRef}>
              <div className={s.searchBox}>
                <form onSubmit={buscar} autoComplete="off">
                  <input
                    suppressHydrationWarning
                    className={s.searchInput}
                    placeholder="Busque na Lima e Lima"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onFocus={() => {
                      setShowSearchBox(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowDown") {
                        e.preventDefault();
                        setSelectedIndex((prev) =>
                          prev < suggestions.length - 1 ? prev + 1 : prev
                        );
                      }

                      if (e.key === "ArrowUp") {
                        e.preventDefault();
                        setSelectedIndex((prev) =>
                          prev > 0 ? prev - 1 : prev
                        );
                      }

                      if (e.key === "Enter" && selectedIndex >= 0) {
                        e.preventDefault();
                        const item = suggestions[selectedIndex];
                        saveHistory(item.name);
                        router.push("/produto/" + item.slug);
                        setSuggestions([]);
                      }
                    }}
                  />

                  {/* 🔍 BOTÃO LUPA */}
                  <button type="submit" className={s.searchIcon}>
                    <FiSearch />
                  </button>
                </form>
              </div>

              {/* 🟢 TAG */}
              <div className={s.tagBox}>
                <img src="/produtos/intelbras.png" alt="Intelbras" />
              </div>
            </div>

            {showSearchBox &&
              (loading ||
                suggestions.length > 0 ||
                (!search && history.length > 0)) && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    width: "100%",
                    background: "#111",
                    borderRadius: 12,
                    marginTop: 8,
                    overflowY: "auto",
                    maxHeight: "70vh",
                    zIndex: 999999,
                    boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
                  }}
                >
                  {loading && (
                    <div style={{ padding: 15, color: "#888" }}>
                      Buscando...
                    </div>
                  )}

                  {/* Histórico */}
                  {!search && history.length > 0 && (
                    <div style={{ padding: 10 }}>
                      <div
                        style={{
                          fontSize: 12,
                          color: "#888",
                          marginBottom: 6,
                        }}
                      >
                        Buscas recentes
                      </div>

                      {history.map((item, index) => (
                        <div
                          key={index}
                          style={{
                            padding: 8,
                            cursor: "pointer",
                            color: "#fff",
                          }}
                          onClick={() => {
  setSearch(item);
  setShowSearchBox(false);
  router.push("/loja?q=" + encodeURIComponent(item));
}}
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  )}

                  {suggestions.map((item, index) => (
                    <Link
                      key={item.id}
                      href={"/produto/" + item.slug}
                      onClick={() => {
                        saveHistory(item.name);
                        setSuggestions([]);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: 12,
                        background:
                          selectedIndex === index ? "#1a1a1a" : "transparent",
                        color: "#fff",
                        textDecoration: "none",
                        borderBottom: "1px solid #222",
                      }}
                    >
                      <img
                        src={item.productimage?.[0]?.url}
                        style={{
                          width: 45,
                          height: 45,
                          objectFit: "cover",
                          borderRadius: 6,
                        }}
                      />

                      <div>
                        <div
                          dangerouslySetInnerHTML={{
                            __html: highlight(item.name),
                          }}
                          style={{ fontSize: 14 }}
                        />

                        <div
                          style={{
                            fontSize: 13,
                            color: "#00c853",
                            marginTop: 4,
                          }}
                        >
                          R${" "}
                          {(calcularPrecoVenda(item.priceCents) / 100).toFixed(
                            2
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
          </div>

          {/* Ícones */}
          <div className={s.icons}>
            <a
              href="https://wa.me/554738423235"
              target="_blank"
              rel="noopener noreferrer"
              className={`${s.iconLink} ${s.whatsapp}`}
            >
              <FaWhatsapp />
            </a>

            <a
              href="https://www.instagram.com/lojalimaelima"
              target="_blank"
              rel="noopener noreferrer"
              className={s.iconLink}
            >
              <FaInstagram />
            </a>

            <a
              href="https://www.google.com/maps?q=Lima+Lima+Instalação+e+Manutenção"
              target="_blank"
              rel="noopener noreferrer"
              className={s.iconLink}
            >
              <HiOutlineLocationMarker />
            </a>

            <div className={s.cartIcon}>
              <Link href={ROUTES.carrinho} className={s.iconLink}>
                <FiShoppingCart />
              </Link>

              {mounted && cartCount > 0 && (
                <span className={s.cartBadge}>{cartCount}</span>
              )}
            </div>

            <div ref={userMenuRef} style={{ position: "relative" }}>
              <button
                className={s.iconLink}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenUserMenu((prev) => !prev);
                }}
              >
                <FaUserCircle />
              </button>

          
{openUserMenu && (
  <div
    style={{
      position: "absolute",
      top: "50px",
      right: 0,
      background: "#0f0f0f",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 18,
      minWidth: 240,
      overflow: "hidden",
      zIndex: 999,
      boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
      backdropFilter: "blur(10px)",
    }}
  >
    {!loadingUser &&
      (user ? (
        <>
          {/* HEADER */}
          <div
            style={{
              padding: "16px 18px",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              color: "#fff",
              fontWeight: 600,
              fontSize: 15,
            }}
          >
            Olá, {user.name}
          </div>

          {/* LINKS */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              padding: 8,
            }}
          >
            <Link
              href="/minha-conta"
              className={s.userMenuItem}
            >
              Minha conta
            </Link>

            <Link
              href="/meus-pedidos"
              className={s.userMenuItem}
            >
              Meus pedidos
            </Link>

            <Link
              href="/minha-conta/dados"
              className={s.userMenuItem}
            >
              Meus dados
            </Link>

            <Link
              href="/minha-conta/seguranca"
              className={s.userMenuItem}
            >
              Segurança
            </Link>

            <button
              onClick={handleLogout}
              className={s.userMenuLogout}
            >
              Sair
            </button>
          </div>
        </>
      ) : (
        <div
          style={{
            padding: 10,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Link
            href="/login"
            className={s.userMenuItem}
          >
            Login
          </Link>

          <Link
            href="/registro"
            className={s.userMenuItem}
          >
            Criar conta
          </Link>
        </div>
      ))}
  </div>
)}


            </div>
          </div>
        </div>

        {/* Menu Desktop */}
        <nav className={s.menu}>
          {menu.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${s.menuLink} ${
                isActive(item.href) ? s.active : ""
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {openMobile && (
          <div className={s.mobileMenu}>
            {menu.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`${s.menuLink} ${
                  isActive(item.href) ? s.active : ""
                }`}
                onClick={() => setOpenMobile(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}