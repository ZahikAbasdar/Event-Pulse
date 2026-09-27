const SOCIETY_COVERS = {
  koshish: '/covers/koshish.svg',
  turf: '/covers/turf.svg',
  ehsaas: '/covers/ehsaas.svg',
  pac: '/covers/pac.svg',
  'debate-society': '/covers/debate.svg',
  stem: '/covers/stem.svg',
};

export function getSocietyCover(society) {
  return society?.coverImageUrl || SOCIETY_COVERS[society?.slug] || '/covers/pcte.svg';
}

export function getEventCover(event) {
  return event?.coverImageUrl || SOCIETY_COVERS[event?.society?.slug] || '/covers/koshish.svg';
}
