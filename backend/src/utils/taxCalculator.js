/**
 * Calculates annual tax liability based on the 5 hackathon illustrative slabs:
 * - Up to 600,000: 0%
 * - 600,001 - 1,200,000: 5% of excess over 600,000
 * - 1,200,001 - 2,400,000: 30,000 + 15% of excess over 1,200,000
 * - 2,400,001 - 3,600,000: 210,000 + 25% of excess over 2,400,000
 * - Above 3,600,000: 510,000 + 35% of excess over 3,600,000
 */
export const calculateTax = (monthlyGross) => {
  const annualGross = Math.round(monthlyGross * 12);
  let annualTax = 0;

  if (annualGross <= 600000) {
    annualTax = 0;
  } else if (annualGross <= 1200000) {
    annualTax = Math.round((annualGross - 600000) * 0.05);
  } else if (annualGross <= 2400000) {
    annualTax = Math.round(30000 + (annualGross - 1200000) * 0.15);
  } else if (annualGross <= 3600000) {
    annualTax = Math.round(210000 + (annualGross - 2400000) * 0.25);
  } else {
    annualTax = Math.round(510000 + (annualGross - 3600000) * 0.35);
  }

  const monthlyTax = Math.round(annualTax / 12);

  return {
    annualGross,
    annualTax,
    monthlyTax,
  };
};
