export function motivationMessage(params: {
  /** 0–1 andel av daglig mål som er nådd i dag (antall vaner / daily_goal_total, cappet 1) */
  todayProgress: number
  /** 0–1 snitt fullføring i måned for daglige vaner */
  monthMeanRatio: number
}): string {
  const { todayProgress, monthMeanRatio } = params
  if (todayProgress >= 1) {
    return 'Bra jobba i dag — du er i mål for antall vaner. Fortsett når du orker.'
  }
  if (todayProgress >= 0.7) {
    return 'Du er godt i gang. Nesten der — ett steg av gangen.'
  }
  if (monthMeanRatio >= 0.6) {
    return 'Fin rytme denne måneden. Små steg teller.'
  }
  if (todayProgress > 0) {
    return 'Fint at du har startet — hver avkrysning er en liten seier.'
  }
  return 'Velkommen — kryss av det du har rukket. Ingen press.'
}
