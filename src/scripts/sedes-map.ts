import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { sedes, type Sede } from '../data/sedes';

const markerIcon = L.divIcon({
  className: 'sedes-marker',
  html: '<span aria-hidden="true"></span>',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
});

export function initSedesMap() {
  const mapEl = document.getElementById('sedes-map');
  const listEl = document.getElementById('sedes-list');
  const countEl = document.getElementById('sedes-count');
  const emptyEl = document.getElementById('sedes-empty');
  const searchInput = document.getElementById('sedes-search') as HTMLInputElement | null;
  const searchBtn = document.getElementById('sedes-search-btn');

  if (!mapEl || !listEl) return;

  const map = L.map(mapEl, { scrollWheelZoom: false }).setView([4.65, -74.1], 6);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(map);

  const markerById = new globalThis.Map<string, L.Marker>();

  function renderList(filtered: Sede[]) {
    const filteredIds = new Set(filtered.map((s) => s.id));

    listEl.querySelectorAll<HTMLElement>('.sedes-list-item').forEach((el) => {
      const id = el.dataset.sedeId;
      el.hidden = !id || !filteredIds.has(id);
    });

    if (countEl) {
      countEl.textContent =
        filtered.length === sedes.length
          ? `${filtered.length} sedes en el mapa`
          : `${filtered.length} de ${sedes.length} sedes`;
    }

    if (emptyEl) {
      emptyEl.hidden = filtered.length > 0;
    }
  }

  function setMarkers(filtered: Sede[]) {
    markerById.forEach((marker) => map.removeLayer(marker));
    markerById.clear();

    filtered.forEach((sede) => {
      const marker = L.marker([sede.lat, sede.lng], { icon: markerIcon })
        .addTo(map)
        .bindPopup(
          `<strong>Smart Fit ${sede.name}</strong><br>${sede.address}<br>${sede.city}` +
            (sede.url
              ? `<br><a href="${sede.url}" target="_blank" rel="noopener">Más info</a>`
              : ''),
        );
      markerById.set(sede.id, marker);
    });

    if (filtered.length > 0) {
      const bounds = L.latLngBounds(filtered.map((s) => [s.lat, s.lng]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    } else {
      map.setView([4.65, -74.1], 6);
    }

    requestAnimationFrame(() => map.invalidateSize());
  }

  function applyFilter(query: string) {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? sedes.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.city.toLowerCase().includes(q) ||
            s.address.toLowerCase().includes(q),
        )
      : [...sedes];
    setMarkers(filtered);
    renderList(filtered);
  }

  listEl.querySelectorAll<HTMLElement>('.sedes-list-item').forEach((el) => {
    el.addEventListener('click', () => {
      const id = el.dataset.sedeId;
      const sede = sedes.find((s) => s.id === id);
      if (!sede) return;
      map.setView([sede.lat, sede.lng], 15, { animate: true });
      markerById.get(sede.id)?.openPopup();
    });
  });

  applyFilter('');

  searchBtn?.addEventListener('click', () => applyFilter(searchInput?.value ?? ''));
  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      applyFilter(searchInput.value);
    }
  });
  searchInput?.addEventListener('input', () => {
    if (!searchInput.value.trim()) applyFilter('');
  });

  mapEl.addEventListener('mouseenter', () => map.scrollWheelZoom.enable());
  mapEl.addEventListener('mouseleave', () => map.scrollWheelZoom.disable());

  window.addEventListener('resize', () => map.invalidateSize());
}
