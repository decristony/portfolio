/* Textos montados a partir dos dados de cada projeto. */

export const capitalize = (text) => text.charAt(0) + text.slice(1).toLowerCase();

/* "Dermatologia estética · São Paulo" -> "Site feito para a Tez, clínica de dermatologia estética em São Paulo." */
export function madeFor(project) {
  const [specialty, city] = project.category.split(' · ');
  return `Site feito para a ${capitalize(project.title)}, clínica de ${specialty.toLowerCase()}${
    city ? ` em ${city}` : ''
  }.`;
}
