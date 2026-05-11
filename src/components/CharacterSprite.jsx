const ink = "#130d1c";
const skin = "#d68a4a";
const skinShade = "#9b5528";
const white = "#fff7ed";
const gold = "#f4bd2f";
const emerald = "#20c878";
const hairBrown = "#7a3f20";

function R({ x, y, w, h, fill, opacity = 1 }) {
  return <rect x={x} y={y} width={w} height={h} fill={fill} opacity={opacity} />;
}

function P({ d, fill, opacity = 1 }) {
  return <path d={d} fill={fill} opacity={opacity} />;
}

function StageShadow() {
  return (
    <g opacity="0.26">
      <ellipse cx="66" cy="116" rx="40" ry="7" fill={ink} />
      <ellipse cx="66" cy="120" rx="27" ry="3" fill={ink} />
    </g>
  );
}

function EmeraldStaff() {
  return (
    <g>
      <P d="M18 42h6v62h-6z" fill={ink} />
      <P d="M20 45h2v57h-2z" fill="#7c4a20" />
      <P d="M10 26h22v22H10z" fill={ink} />
      <P d="M14 30h14v14H14z" fill="#b98525" />
      <P d="M16 32h10v10H16z" fill="#21c879" />
      <P d="M18 34h6v6h-6z" fill="#8fffd0" />
      <P d="M19 35h3v3h-3z" fill="#ecfff8" />
      <P d="M7 36h8v6H7zM27 36h8v6h-8z" fill="#b98525" />
      <P d="M13 27h4v4h-4zM25 27h4v4h-4z" fill={gold} />
    </g>
  );
}

function HealerSprite({ equipment = {} }) {
  return (
    <>
      <g opacity="0.84">
        <P d="M30 31h3v4h-3zM101 38h3v4h-3zM94 91h4v3h-4z" fill="#bfffe7" />
        <P d="M36 23h6v2h-6zM92 27h5v2h-5z" fill={gold} />
      </g>
      <EmeraldStaff />

      <g>
        <P d="M41 67h52v10h7v29h-8v7H42v-7h-8V77h7z" fill={ink} />
        <P d="M48 72h38v32H48z" fill="#f8f3ef" />
        <P d="M53 74h10v27H53z" fill="#ffffff" opacity="0.45" />
        <P d="M64 72h9v35h-9z" fill={gold} />
        <P d="M47 97h40v10H47z" fill={emerald} />
        <P d="M73 72h12v31H73z" fill="#e5d8c3" />
        <P d="M43 75h10v28H43zM86 75h10v27H86z" fill={ink} />
        <P d="M45 78h7v21h-7zM88 78h6v20h-6z" fill="#f8f3ef" />
        <P d="M45 98h8v9h-8zM87 97h8v9h-8z" fill="#d68a4a" />
        <P d="M45 105h8v3h-8zM87 104h8v3h-8z" fill={skinShade} />
        <P d="M55 88h13v6H55zM77 88h14v6H77z" fill="#9bb19b" opacity="0.7" />
        <P d="M65 95h8v5h-8z" fill="#9b6b2d" />
        <P d="M42 104h51v5H42z" fill={emerald} />
        <P d="M51 109h17v9H51zM75 109h18v9H75z" fill={ink} />
        <P d="M54 110h13v6H54zM78 110h13v6H78z" fill="#5a341f" />
      </g>

      <g>
        <P d="M38 34h60v9h8v31h-7v9H37v-9h-7V43h8z" fill={ink} />
        <P d="M44 42h48v27H44z" fill="#f8f3ef" />
        <P d="M48 45h40v7H48z" fill="#ffffff" opacity="0.62" />
        <P d="M45 65h45v9H45z" fill={gold} />
        <P d="M52 39h32v7H52z" fill="#e6dac7" />
        <P d="M63 33h20v15H63z" fill={emerald} />
        <P d="M68 37h11v7H68z" fill="#9fffd7" />
        <P d="M71 39h5v3h-5z" fill="#ecfff8" />
        <P d="M36 48h8v28h-8zM91 48h9v33h-9z" fill="#f8f3ef" />
        <P d="M91 65h9v17h-9z" fill="#d8caba" />
        <P d="M41 55h8v22h-8zM88 56h7v20h-7z" fill={emerald} />
      </g>

      <g>
        <P d="M42 48h50v16h7v30h-8v8H41v-8h-7V64h8z" fill={ink} />
        <P d="M50 55h34v32H50z" fill={skin} />
        <P d="M50 82h34v7H50z" fill={skinShade} opacity="0.55" />
        <P d="M45 50h43v10H45z" fill={hairBrown} />
        <P d="M42 58h12v29H42zM82 58h12v29H82z" fill={hairBrown} />
        <P d="M47 78h9v16h-9zM80 77h10v17H80z" fill="#5f331c" />
        <P d="M56 66h9v8h-9zM73 66h9v8h-9z" fill={white} />
        <P d="M59 69h3v3h-3zM76 69h3v3h-3z" fill={ink} />
        <P d="M64 83h12v4H64z" fill="#9b2e2e" />
        <P d="M58 56h26v3H58z" fill="#ffffff" opacity="0.18" />
      </g>

      {equipment.head === "emerald-crown" && (
        <g>
          <P d="M40 39h58v9H40z" fill={ink} />
          <P d="M45 42h48v4H45z" fill={gold} />
          <P d="M53 34h9v10h-9zM68 30h8v14h-8zM84 34h9v10h-9z" fill={emerald} />
        </g>
      )}
    </>
  );
}

const rolePalette = {
  assassin: { main: "#251638", shade: "#120a1d", trim: "#8e3ccf", accent: "#f45b69", weapon: "daggers" },
  warrior: { main: "#d8d0e7", shade: "#d73f4a", trim: "#ffcc35", accent: "#38bdf8", weapon: "sword-shield" },
  mage: { main: "#2387d9", shade: "#155394", trim: "#ffcc35", accent: "#7ee5ff", weapon: "staff" },
  tank: { main: "#7b879c", shade: "#202b3c", trim: "#ffcc35", accent: "#2c5c91", weapon: "shield" },
  bard: { main: "#2f8f5b", shade: "#5a341f", trim: "#d6b16a", accent: "#ffcc35", weapon: "lute" },
  ranger: { main: "#20b85c", shade: "#166534", trim: "#d8f7ce", accent: "#ffcc35", weapon: "bow" },
};

function ClassWeapon({ type, p }) {
  if (type === "daggers") {
    return (
      <g>
        <P d="M28 90h25v7H28zM101 88h25v7h-25z" fill="#d8d0e7" />
        <P d="M23 96h20v4H23zM112 94h20v4h-20z" fill={white} />
      </g>
    );
  }

  if (type === "sword-shield") {
    return (
      <g>
        <P d="M111 36h6v57h-6zM117 30h5v45h-5zM122 28h3v31h-3z" fill={p.accent} />
        <P d="M105 93h25v7h-25zM113 100h7v20h-7z" fill={ink} />
        <P d="M25 82h35v44H25z" fill={ink} />
        <P d="M31 89h23v30H31z" fill="#b72e38" />
        <P d="M40 92h5v24h-5zM34 103h17v5H34z" fill={p.trim} />
      </g>
    );
  }

  if (type === "shield") {
    return (
      <g>
        <P d="M100 76h42v54h-7v10h-28v-10h-7z" fill={ink} />
        <P d="M108 84h26v41h-5v8h-16v-8h-5z" fill={p.accent} />
        <P d="M118 88h5v36h-5zM111 103h20v6h-20z" fill={p.trim} />
      </g>
    );
  }

  if (type === "lute") {
    return (
      <g>
        <P d="M101 87h28v34h-5v8h-19v-8h-5V87z" fill={ink} />
        <P d="M107 94h16v21h-3v5h-10v-5h-3z" fill="#8b5a2b" />
        <P d="M116 56h6v39h-6zM109 54h20v7h-20z" fill="#8b5a2b" />
      </g>
    );
  }

  if (type === "bow") {
    return (
      <g>
        <P d="M107 45h5v70h-5z" fill="#8b5a2b" />
        <P d="M112 54h4v15h-4zM112 92h4v15h-4z" fill="#8b5a2b" />
        <P d="M108 54h1v52h-1z" fill={white} opacity="0.75" />
        <P d="M99 83h24v3H99z" fill={p.accent} />
      </g>
    );
  }

  return <EmeraldStaff />;
}

function EquipmentAura({ equipment = {} }) {
  if (equipment.aura === "focus-aura") {
    return (
      <g opacity="0.82">
        <P d="M29 78h5v5h-5zM101 70h6v6h-6zM95 108h4v4h-4zM38 112h4v4h-4z" fill={gold} />
        <P d="M24 92h3v12h-3zM106 87h3v13h-3zM59 26h4v11h-4z" fill="#fff2a8" />
      </g>
    );
  }

  if (equipment.aura === "aegis-core") {
    return (
      <g opacity="0.7">
        <ellipse cx="68" cy="78" rx="47" ry="55" fill="none" stroke="#ffcc35" strokeWidth="4" />
        <ellipse cx="68" cy="78" rx="36" ry="43" fill="none" stroke="#9fd0ff" strokeWidth="2" />
        <P d="M63 15h10v10H63zM24 74h8v8h-8zM104 74h8v8h-8z" fill={gold} />
      </g>
    );
  }

  return null;
}

function EquipmentBackOverlay({ equipment = {} }) {
  if (equipment.armor === "guild-cape") {
    return (
      <g>
        <P d="M34 55h68v69h-9v13H43v-13h-9z" fill={ink} opacity="0.88" />
        <P d="M41 61h54v59h-8v10H49v-10h-8z" fill="#6043b4" />
        <P d="M49 66h12v51H49z" fill="#8a6be6" opacity="0.45" />
      </g>
    );
  }

  if (equipment.armor === "shadow-veil") {
    return (
      <g>
        <P d="M31 41h75v30h8v57h-13v11H36v-11H23V71h8z" fill={ink} opacity="0.9" />
        <P d="M38 50h60v24h7v47h-10v8H43v-8H32V74h6z" fill="#21132f" />
        <P d="M45 55h45v8H45z" fill="#7c2cc8" opacity="0.6" />
      </g>
    );
  }

  return null;
}

function EquipmentFrontOverlay({ equipment = {}, roleId }) {
  return (
    <>
      {equipment.head === "emerald-crown" && roleId !== "healer" && (
        <g>
          <P d="M41 35h56v9H41z" fill={ink} />
          <P d="M47 38h44v4H47z" fill={gold} />
          <P d="M53 31h9v9h-9zM67 27h9v13h-9zM82 31h9v9h-9z" fill={emerald} />
        </g>
      )}

      {equipment.head === "crimson-helm" && (
        <g>
          <P d="M39 34h59v18h7v20H33V52h6z" fill={ink} />
          <P d="M47 40h43v19H47z" fill="#b72e38" />
          <P d="M63 34h11v28H63z" fill="#d8d0e7" />
          <P d="M50 58h37v6H50z" fill={gold} />
        </g>
      )}

      {equipment.head === "forest-mark" && (
        <g>
          <P d="M45 34h49v12H45z" fill={ink} />
          <P d="M50 37h39v6H50z" fill="#20b85c" />
          <P d="M83 29h18v7h-7v8h-11z" fill={ink} />
          <P d="M87 31h10v4h-5v6h-5z" fill="#d8f7ce" />
        </g>
      )}

      {equipment.weapon === "arcane-orb" && (
        <g>
          <P d="M103 63h20v20h-20z" fill={ink} />
          <P d="M108 68h10v10h-10z" fill="#47a7f5" />
          <P d="M110 70h6v6h-6z" fill="#b7f7ff" />
          <P d="M99 75h8v8h-8zM119 58h6v6h-6z" fill="#a855f7" />
        </g>
      )}

      {equipment.weapon === "silver-lute" && (
        <g>
          <P d="M100 86h31v36h-6v9h-20v-9h-6V86z" fill={ink} />
          <P d="M107 93h17v22h-3v6h-11v-6h-3z" fill="#d8d0e7" />
          <P d="M116 55h6v40h-6zM108 53h22v7h-22z" fill="#b7bdc7" />
          <P d="M111 101h10v8h-10z" fill={gold} />
        </g>
      )}
    </>
  );
}

function GenericClass({ roleId, equipment = {} }) {
  const p = rolePalette[roleId] ?? rolePalette.mage;
  const hooded = roleId === "assassin" || roleId === "ranger";
  const armored = roleId === "tank";
  const mage = roleId === "mage";
  const bard = roleId === "bard";

  return (
    <>
      <ClassWeapon type={equipment.weapon === "moon-blade" ? "sword-shield" : p.weapon} p={p} />
      <g>
        <P d="M40 73h54v11h8v32h-8v8H40v-8h-8V84h8z" fill={ink} />
        <P d="M47 80h40v31H47z" fill={p.main} />
        <P d="M53 82h10v27H53z" fill={white} opacity="0.18" />
        <P d="M66 80h7v35h-7z" fill={p.trim} />
        <P d="M47 107h40v8H47z" fill={p.shade} />
        <P d="M35 81h12v30H35zM88 80h12v29H88z" fill={ink} />
        <P d="M38 85h7v21h-7zM91 84h7v20h-7z" fill={p.shade} />
        <P d="M41 108h10v9H41zM87 106h10v9H87z" fill={skin} />
        <P d="M49 116h18v9H49zM75 115h19v10H75z" fill={ink} />
        <P d="M52 117h13v6H52zM78 116h14v6H78z" fill={p.shade} />
      </g>
      <g>
        <P d="M42 45h51v15h7v29h-8v8H41v-8h-7V60h8z" fill={ink} />
        <P d="M50 53h35v30H50z" fill={armored || roleId === "assassin" ? p.shade : skin} />
        <P d="M50 78h35v7H50z" fill={armored || roleId === "assassin" ? p.shade : skinShade} opacity="0.55" />
        <P d="M54 63h9v8h-9zM73 63h9v8h-9z" fill={white} />
        <P d="M57 66h3v3h-3zM76 66h3v3h-3z" fill={ink} />
        {roleId !== "assassin" && roleId !== "tank" && <P d="M64 81h11v4H64z" fill="#9b2e2e" />}
      </g>

      {hooded && (
        <g>
          <P d="M37 35h62v18h8v34H30V53h7z" fill={ink} />
          <P d="M45 42h47v31H45z" fill={p.shade} />
          <P d="M48 71h41v9H48z" fill={p.main} />
          <P d="M51 47h36v5H51z" fill={p.trim} opacity="0.55" />
        </g>
      )}

      {mage && (
        <g>
          <P d="M68 9h20v8h7v11h9v20h9v12H35V48h11V32h9V19h13z" fill={ink} />
          <P d="M71 16h14v9h7v11h8v12H50V36h8V24h13z" fill={p.main} />
          <P d="M47 48h56v9H42v-6h5z" fill={p.trim} />
        </g>
      )}

      {armored && (
        <g>
          <P d="M38 33h64v20h8v34H30V53h8z" fill={ink} />
          <P d="M46 41h48v25H46z" fill="#9ca8ba" />
          <P d="M52 66h36v14H52z" fill="#202b3c" />
          <P d="M66 27h9v17H66z" fill={p.trim} />
        </g>
      )}

      {roleId === "warrior" && (
        <g>
          <P d="M40 36h57v15h8v31h-8V62h-9V50H51v12h-8v20h-9V51h6z" fill={ink} />
          <P d="M48 40h41v13H48zM41 52h13v22H41zM86 52h13v22H86z" fill="#8a4e2c" />
        </g>
      )}

      {bard && (
        <g>
          <P d="M38 40h60v13h10v11H36v17h-8V53h10z" fill={ink} />
          <P d="M46 45h47v11H46z" fill={p.main} />
          <P d="M52 55h37v7H52z" fill={p.trim} />
          <P d="M96 32h21v8h-6v7H96z" fill={ink} />
          <P d="M100 34h13v5h-5v6h-8z" fill={white} />
        </g>
      )}

      {!hooded && !mage && !armored && roleId !== "warrior" && !bard && (
        <P d="M46 45h43v10H46zM40 54h11v27H40zM85 54h11v27H85z" fill="#7a3f20" />
      )}
    </>
  );
}

export function CharacterSprite({
  roleId = "healer",
  equipment = {},
  className = "",
}) {
  return (
    <svg
      className={`character-art character-art--spritey ${className}`}
      viewBox="0 0 140 150"
      role="img"
      aria-label={`${roleId} fantasy pixel character`}
      shapeRendering="crispEdges"
    >
      <StageShadow />
      <EquipmentAura equipment={equipment} />
      <EquipmentBackOverlay equipment={equipment} />
      {roleId === "healer" ? (
        <HealerSprite equipment={equipment} />
      ) : (
        <GenericClass roleId={roleId} equipment={equipment} />
      )}
      <EquipmentFrontOverlay equipment={equipment} roleId={roleId} />
    </svg>
  );
}
