// Fonction pour analyser le top 5 des titres populaires
function analyzeTop5Tracks() {
    console.log('🔍 Analyse du top 5 des titres...');
    
    // Nouvelle approche : utiliser data-testid="tracklist-row"
    const trackRows = document.querySelectorAll('[data-testid="tracklist-row"]');
    console.log(`🎵 ${trackRows.length} lignes de titres trouvées`);
    
    const top5Streams = [];
    
    // Analyser chaque ligne de titre
    for (let i = 0; i < Math.min(5, trackRows.length); i++) {
      const row = trackRows[i];
      const rowText = row.textContent;
      
      console.log(`📊 Ligne ${i+1}: "${rowText.substring(0, 100)}..."`);
      
      // Chercher le div avec la classe qui contient les streams
      const streamDivs = row.querySelectorAll('div[class*="encore-text"]');
      
      for (let div of streamDivs) {
        const divText = div.textContent.trim();
        
        // Chercher un pattern de streams (nombre avec ou sans espaces, pas de : pour durée)
        if (!divText.includes(':') && divText.match(/^\d{1,3}(?:\s\d{3})*$|^\d{1,3}\s\d{3}$|^\d{4,7}$/)) {
          const streamCount = parseInt(divText.replace(/\s/g, ''));
          
          if (streamCount > 100 && streamCount < 50000000) { // Limite plus basse pour petits artistes
            console.log(`🎯 Stream trouvé ligne ${i+1}: ${streamCount.toLocaleString()} (texte: "${divText}")`);
            top5Streams.push(streamCount);
            break; // Passer au titre suivant
          }
        }
      }
    }
    
    // Fallback si pas de trackRows : ancienne méthode
    if (trackRows.length === 0) {
      console.log('🔄 Fallback: recherche par H2 Populaires...');
      
      // Chercher le h2 "Populaires"
      const h2Elements = document.querySelectorAll('h2');
      let popularesH2 = null;
      
      for (let h2 of h2Elements) {
        if (h2.textContent.trim() === 'Populaires') {
          popularesH2 = h2;
          console.log('✅ H2 "Populaires" trouvé !');
          break;
        }
      }
      
      if (!popularesH2) {
        console.log('❌ H2 "Populaires" non trouvé');
        return null;
      }
      
      // Chercher la section parent qui contient les titres
      let popularSection = popularesH2.closest('section') || popularesH2.parentElement;
      
      if (!popularSection) {
        console.log('❌ Section parent des Populaires non trouvée');
        return null;
      }
      
      console.log('✅ Section Populaires trouvée !');
      
      // Fallback avec parsing manuel des nombres séparés par espaces
      const sectionText = popularSection.textContent;
      console.log(`📄 Texte section (300 chars): "${sectionText.substring(0, 300)}..."`);
      
      // Pattern spécial pour nombres avec espaces comme "1 791 149"
      const spaceNumberPattern = /\b(\d{1,3}(?:\s\d{3}){1,2})\b/g;
      const matches = sectionText.match(spaceNumberPattern);
      
      console.log(`🔍 Nombres avec espaces trouvés: ${matches ? matches.join(', ') : 'aucun'}`);
      
      if (matches) {
        for (let match of matches) {
          const streamCount = parseInt(match.replace(/\s/g, ''));
          
          if (streamCount > 10000 && streamCount < 50000000) {
            console.log(`🎵 Stream validé (fallback): ${streamCount.toLocaleString()}`);
            top5Streams.push(streamCount);
          }
        }
      }
    }
    
    if (top5Streams.length >= 3) {
      // Trier par ordre décroissant et prendre les 5 plus gros
      top5Streams.sort((a, b) => b - a);
      const finalTop5 = top5Streams.slice(0, 5);
      
      // Pondération : diviser le hit principal par 2 (plus réaliste)
      const weightedTop5 = [...finalTop5];
      if (weightedTop5.length > 0) {
        const originalTop1 = weightedTop5[0];
        weightedTop5[0] = Math.round(weightedTop5[0] / 2);
        console.log(`⚖️ Pondération du hit principal: ${originalTop1.toLocaleString()} → ${weightedTop5[0].toLocaleString()}`);
      }
      
      const average = weightedTop5.reduce((sum, streams) => sum + streams, 0) / weightedTop5.length;
      
      console.log(`✅ Top ${finalTop5.length} streams trouvés:`);
      finalTop5.forEach((streams, i) => {
        if (i === 0) {
          console.log(`   ${i+1}. ${streams.toLocaleString()} streams (pondéré: ${weightedTop5[0].toLocaleString()})`);
        } else {
          console.log(`   ${i+1}. ${streams.toLocaleString()} streams`);
        }
      });
      console.log(`✅ Moyenne pondérée: ${Math.round(average).toLocaleString()} streams`);
      
      return {
        tracks: finalTop5,
        average: average,
        count: finalTop5.length
      };
    }
    
    console.log(`❌ Pas assez de streams trouvés (${top5Streams.length}/3 minimum)`);
    return null;
  }
  
  // Fonction pour parser les nombres de streams (mise à jour)
  function parseStreamCount(streamText) {
    // Retire les espaces
    let cleaned = streamText.replace(/\s/g, '');
    
    // Gère les suffixes K, M, B
    if (cleaned.includes('K')) {
      return Math.round(parseFloat(cleaned.replace('K', '')) * 1000);
    } else if (cleaned.includes('M')) {
      return Math.round(parseFloat(cleaned.replace('M', '')) * 1000000);
    } else if (cleaned.includes('B')) {
      return Math.round(parseFloat(cleaned.replace('B', '')) * 1000000000);
    } else {
      // Nombre normal
      return parseInt(cleaned.replace(/[,.]/g, ''));
    }
  }
  
  // Fonction mise à jour pour calculer streams par auditeur intelligemment
  function calculateStreamsPerListener(monthlyListeners) {
    console.log(`🎯 Calcul intelligent pour ${monthlyListeners} auditeurs`);
    
    // Étape 1: Utiliser les données en cache si disponibles
    if (cachedTop5Data) {
      console.log('💾 Utilisation des données top 5 en cache');
      // Calcul basé sur les données réelles
      const hitRatio = cachedTop5Data.average / monthlyListeners;
      console.log(`📊 Hit ratio: ${hitRatio.toFixed(2)}`);
      
      // Coefficients équilibrés par taille d'artiste
      let coefficient;
      let category;
      
      if (monthlyListeners < 50000) {
        coefficient = 0.35;
        category = 'Artiste émergent';
      } else if (monthlyListeners < 500000) {
        coefficient = 0.25;
        category = 'Artiste en croissance';
      } else if (monthlyListeners < 2000000) {
        coefficient = 0.20;
        category = 'Artiste établi';
      } else {
        coefficient = 0.15;
        category = 'Artiste mainstream';
      }
      
      const calculatedRatio = hitRatio * coefficient;
      const finalRatio = Math.max(0.5, Math.min(50, calculatedRatio));
      
      console.log(`📈 Catégorie: ${category}`);
      console.log(`📈 Coefficient: ${coefficient}`);
      console.log(`✅ Ratio intelligent: ${finalRatio.toFixed(2)} streams/auditeur`);
      
      return finalRatio;
    } else {
      // Fallback sur la courbe classique
      console.log('🔄 Fallback sur la courbe classique (pas de données top 5)');
      return calculateStreamsPerListenerFallback(monthlyListeners);
    }
  }
  
  // Fonction de fallback (ancienne logique)
  function calculateStreamsPerListenerFallback(monthlyListeners) {
    let baseRatio;
    let variationRange;
    
    if (monthlyListeners < 50000) {
      baseRatio = 4;
      variationRange = 1;
      console.log('📊 Fallback - Catégorie: Artiste émergent');
    } else if (monthlyListeners < 500000) {
      baseRatio = 6.5;
      variationRange = 1.5;
      console.log('📊 Fallback - Catégorie: Artiste en croissance');
    } else if (monthlyListeners < 2000000) {
      baseRatio = 5;
      variationRange = 1;
      console.log('📊 Fallback - Catégorie: Artiste établi');
    } else {
      baseRatio = 3;
      variationRange = 1;
      console.log('📊 Fallback - Catégorie: Artiste mainstream');
    }
    
    const randomFactor = (Math.random() - 0.5) * variationRange;
    const finalRatio = Math.max(1, baseRatio + randomFactor);
    
    console.log(`✅ Ratio fallback: ${finalRatio.toFixed(1)} streams/auditeur`);
    return finalRatio;
  }// Content script pour Spotify Revenus Estimés
  console.log('🎵 Spotify Revenus Estimés chargé !');
  
  // Fonction pour détecter si on est sur une page artiste
  function isArtistPage() {
    return window.location.pathname.includes('/artist/');
  }
  
  // Fonction pour trouver le nombre d'auditeurs mensuels
  function getMonthlyListeners() {
    console.log('🔍 Recherche des auditeurs mensuels...');
    
    // Stratégie 1: Chercher dans les éléments visibles seulement
    const visibleElements = document.querySelectorAll('span, div, p, h1, h2, h3');
    console.log(`👀 Nombre d'éléments visibles à analyser: ${visibleElements.length}`);
    
    for (let element of visibleElements) {
      const text = element.textContent;
      
      // On veut un texte court qui contient "auditeurs mensuels"
      if (text && text.includes('auditeurs mensuels') && text.length < 100) {
        console.log(`✅ Trouvé texte court: "${text}"`);
        console.log(`📝 Longueur: ${text.length} caractères`);
        
        // Pattern spécifique pour "X auditeurs mensuels"
        const pattern = text.match(/(\d[\d\s]*)\s*auditeurs mensuels/);
        if (pattern && pattern[1]) {
          const number = parseInt(pattern[1].replace(/\s/g, ''));
          console.log(`🎯 Nombre extrait: ${number}`);
          
          // Vérification de sanité: entre 1 et 100 millions
          if (number > 0 && number < 100000000) {
            return number;
          }
        }
      }
    }
    
    // Stratégie 2: Si la première ne marche pas, chercher avec une approche différente
    console.log('🔄 Stratégie 2: recherche par pattern dans tous les petits textes');
    
    for (let element of visibleElements) {
      const text = element.textContent;
      
      if (text && text.length < 50 && text.includes('auditeurs')) {
        console.log(`🔍 Texte candidat: "${text}"`);
        
        // Chercher pattern "17 525 auditeurs mensuels" ou similaire
        const match = text.match(/(\d{1,3}(?:\s\d{3})*)\s*auditeurs/);
        if (match && match[1]) {
          const number = parseInt(match[1].replace(/\s/g, ''));
          console.log(`🎯 Nombre trouvé stratégie 2: ${number}`);
          if (number > 0 && number < 100000000) {
            return number;
          }
        }
      }
    }
    
    console.log('❌ Aucun auditeur mensuel trouvé');
    return null;
  }
  
  // Fonction pour calculer streams par auditeur selon la taille de l'artiste
  function calculateStreamsPerListener(monthlyListeners) {
    console.log(`🎯 Calcul streams/auditeur pour ${monthlyListeners} auditeurs`);
    
    let baseRatio;
    let variationRange;
    
    if (monthlyListeners < 50000) {
      // Petits artistes émergents - fans modérés
      baseRatio = 4;
      variationRange = 1; // 3-5 streams/auditeur
      console.log('📊 Catégorie: Artiste émergent');
    } else if (monthlyListeners < 500000) {
      // Artistes moyens - meilleur engagement
      baseRatio = 6.5;
      variationRange = 1.5; // 5-8 streams/auditeur
      console.log('📊 Catégorie: Artiste en croissance');
    } else if (monthlyListeners < 2000000) {
      // Artistes établis - bon équilibre
      baseRatio = 5;
      variationRange = 1; // 4-6 streams/auditeur
      console.log('📊 Catégorie: Artiste établi');
    } else {
      // Gros artistes mainstream - beaucoup de casual listening
      baseRatio = 3;
      variationRange = 1; // 2-4 streams/auditeur
      console.log('📊 Catégorie: Artiste mainstream');
    }
    
    // Ajouter une petite variation aléatoire pour éviter les résultats trop prévisibles
    const randomFactor = (Math.random() - 0.5) * variationRange;
    const finalRatio = Math.max(1, baseRatio + randomFactor);
    
    console.log(`✅ Ratio calculé: ${finalRatio.toFixed(1)} streams/auditeur`);
    return finalRatio;
  }
  
  // Fonction pour calculer les revenus estimés
  function calculateRevenue(monthlyListeners) {
    // Utilise la courbe intelligente au lieu d'un ratio fixe
    const streamsPerListener = calculateStreamsPerListener(monthlyListeners);
    const revenuePerStream = 0.004; // $0.004 par stream
    const usdToEur = 0.92; // Taux de change approximatif USD -> EUR
    
    const monthlyStreams = monthlyListeners * streamsPerListener;
    const monthlyRevenueUSD = monthlyStreams * revenuePerStream;
    const monthlyRevenueEUR = monthlyRevenueUSD * usdToEur;
    
    return {
      streams: monthlyStreams,
      revenue: monthlyRevenueEUR,
      ratio: streamsPerListener
    };
  }
  
  // Fonction pour formater les nombres (1234567 -> "1,2M")
  function formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace('.', ',') + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(0) + 'K'; // Pas de décimale pour les K
    } else {
      return num.toString();
    }
  }
  
  // Fonction pour formater les revenus (arrondir à l'euro)
  function formatRevenue(revenue) {
    return Math.round(revenue).toLocaleString('fr-FR');
  }
  
  // Fonction pour créer et injecter le bouton
  function injectRevenueButton() {
    // Vérifie qu'on n'a pas déjà ajouté le bouton
    if (document.getElementById('revenue-estimator-btn')) {
      return;
    }
    
    const monthlyListeners = getMonthlyListeners();
    
    if (!monthlyListeners) {
      console.log('Auditeurs mensuels non trouvés...');
      return;
    }
    
    console.log(`✅ Trouvé: ${monthlyListeners} auditeurs mensuels`);
    
    // Chercher l'élément qui contient exactement le texte des auditeurs
    const visibleElements = document.querySelectorAll('span, div, p');
    let targetElement = null;
    
    for (let element of visibleElements) {
      const text = element.textContent;
      if (text && text.includes('auditeurs mensuels') && text.length < 50) {
        console.log(`🎯 Élément cible trouvé: "${text}"`);
        targetElement = element;
        break;
      }
    }
    
    if (targetElement) {
      // Crée le bouton mini
      const button = document.createElement('button');
      button.id = 'revenue-estimator-btn';
      button.innerHTML = '💰';
      button.title = 'Voir les revenus estimés'; // Tooltip au survol
      button.className = 'revenue-estimator-button';
      
      // Style mini et discret
      button.style.cssText = `
        background: #1db954;
        color: white;
        border: none;
        padding: 2px 6px;
        border-radius: 8px;
        font-weight: 500;
        cursor: pointer;
        margin-left: 8px;
        font-size: 10px;
        display: inline-block;
        vertical-align: middle;
        transition: all 0.2s ease;
        box-shadow: 0 1px 4px rgba(29, 185, 84, 0.3);
        line-height: 1;
      `;
      
      // Effet hover subtil
      button.addEventListener('mouseenter', () => {
        button.style.transform = 'scale(1.1)';
        button.style.boxShadow = '0 2px 8px rgba(29, 185, 84, 0.5)';
      });
      
      button.addEventListener('mouseleave', () => {
        button.style.transform = 'scale(1)';
        button.style.boxShadow = '0 1px 4px rgba(29, 185, 84, 0.3)';
      });
      
      // Action au clic
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const estimates = calculateRevenue(monthlyListeners);
        
        // Animation de transformation magique
        button.style.transition = 'all 0.3s ease';
        button.style.transform = 'scale(0.8)';
        button.style.opacity = '0.5';
        
        setTimeout(() => {
          // Remplace le bouton par la boîte révélée
          createRevenueReveal(button, estimates, monthlyListeners);
        }, 150);
      });
      
      // Insertion juste après le texte "auditeurs mensuels"
      targetElement.style.display = 'inline';
      
      // Crée un conteneur pour garder tout aligné
      const container = document.createElement('span');
      container.style.display = 'inline';
      container.style.whiteSpace = 'nowrap';
      
      // Remplace le contenu de l'élément
      const originalText = targetElement.textContent;
      targetElement.textContent = '';
      
      // Ajoute le texte et le bouton dans le conteneur
      const textNode = document.createTextNode(originalText);
      container.appendChild(textNode);
      container.appendChild(button);
      
      targetElement.appendChild(container);
    }
  }

  // Fonction pour créer la révélation magique des revenus
  function createRevenueReveal(buttonElement, estimates, monthlyListeners) {
    // Crée la boîte révélation
    const revealBox = document.createElement('div');
    revealBox.id = 'revenue-reveal-box';
    revealBox.className = 'revenue-reveal';
    
    // Contenu de la révélation
    revealBox.innerHTML = `
      <div class="revenue-content">
        <div class="revenue-main">💶 ~${formatRevenue(estimates.revenue)}€/mois</div>
        <div class="revenue-details">
          📊 ${formatNumber(estimates.streams)} streams/mois
        </div>
        <div class="revenue-disclaimer">Estimation</div>
      </div>
      <button class="revenue-close">×</button>
    `;
    
    // Styles pour la boîte magique
    revealBox.style.cssText = `
      background: linear-gradient(135deg, #1db954, #1ed760);
      color: white;
      border: none;
      padding: 8px 12px;
      border-radius: 12px;
      font-weight: 500;
      margin-left: 8px;
      display: inline-block;
      vertical-align: middle;
      box-shadow: 0 4px 16px rgba(29, 185, 84, 0.4);
      transform: scale(0.8);
      opacity: 0;
      transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      position: relative;
      white-space: nowrap;
      font-size: 11px;
      line-height: 1.2;
    `;
    
    // Styles pour le contenu
    const style = document.createElement('style');
    style.textContent = `
      .revenue-content {
        display: inline-block;
        text-align: left;
      }
      
      .revenue-main {
        font-weight: bold;
        font-size: 12px;
        margin-bottom: 2px;
      }
      
      .revenue-details {
        font-size: 10px;
        opacity: 0.9;
        margin-bottom: 1px;
      }
      
      .revenue-disclaimer {
        font-size: 8px;
        opacity: 0.7;
        font-style: italic;
      }
      
      .revenue-close {
        background: none;
        border: none;
        color: white;
        font-size: 14px;
        font-weight: bold;
        cursor: pointer;
        margin-left: 8px;
        opacity: 0.7;
        transition: opacity 0.2s ease;
        vertical-align: top;
        line-height: 1;
        padding: 0;
      }
      
      .revenue-close:hover {
        opacity: 1;
        transform: scale(1.1);
      }
    `;
    
    document.head.appendChild(style);
    
    // Remplace le bouton par la révélation
    buttonElement.parentNode.replaceChild(revealBox, buttonElement);
    
    // Animation d'apparition magique
    setTimeout(() => {
      revealBox.style.transform = 'scale(1)';
      revealBox.style.opacity = '1';
    }, 50);
    
    // Bouton de fermeture
    const closeButton = revealBox.querySelector('.revenue-close');
    closeButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Animation de fermeture
      revealBox.style.transform = 'scale(0.8)';
      revealBox.style.opacity = '0';
      
      setTimeout(() => {
        // Recrée le bouton original
        recreateOriginalButton(revealBox, monthlyListeners);
      }, 200);
    });
    
    console.log('✨ Révélation magique créée !');
  }
  
  // Fonction pour recréer le bouton original
  function recreateOriginalButton(revealElement, monthlyListeners) {
    const button = document.createElement('button');
    button.id = 'revenue-estimator-btn';
    button.innerHTML = '💰';
    button.title = 'Voir les revenus estimés';
    button.className = 'revenue-estimator-button';
    
    // Même style que l'original
    button.style.cssText = `
      background: #1db954;
      color: white;
      border: none;
      padding: 2px 6px;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      margin-left: 8px;
      font-size: 10px;
      display: inline-block;
      vertical-align: middle;
      transition: all 0.2s ease;
      box-shadow: 0 1px 4px rgba(29, 185, 84, 0.3);
      line-height: 1;
      transform: scale(0.8);
      opacity: 0;
    `;
    
    // Effets hover
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'scale(1.1)';
      button.style.boxShadow = '0 2px 8px rgba(29, 185, 84, 0.5)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.transform = 'scale(1)';
      button.style.boxShadow = '0 1px 4px rgba(29, 185, 84, 0.3)';
    });
    
    // Recrée l'événement de clic
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const estimates = calculateRevenue(monthlyListeners);
      
      button.style.transition = 'all 0.3s ease';
      button.style.transform = 'scale(0.8)';
      button.style.opacity = '0.5';
      
      setTimeout(() => {
        createRevenueReveal(button, estimates, monthlyListeners);
      }, 150);
    });
    
    // Remplace la révélation par le bouton
    revealElement.parentNode.replaceChild(button, revealElement);
    
    // Animation d'apparition
    setTimeout(() => {
      button.style.transform = 'scale(1)';
      button.style.opacity = '1';
    }, 50);
    
    console.log('🔄 Bouton original recréé !');
  }
  
  // Fonction principale qui s'exécute quand la page charge
  function init() {
    if (isArtistPage()) {
      console.log('📍 On artist page, waiting for content to load...');
      
      // Lancer l'analyse du top 5 un peu plus tard pour que le DOM se charge
      setTimeout(() => {
        console.log('🚀 Analyse du top 5 (1.5s)...');
        cachedTop5Data = analyzeTop5Tracks();
      }, 1500); // Plus tard : 1.5s au lieu de 500ms
      
      // Spotify charge le contenu dynamiquement, on doit attendre un peu pour le bouton
      setTimeout(() => {
        injectRevenueButton();
      }, 2000);
    }
  }
  
  // Lance le script quand la page est prête
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  // Écoute les changements de page (Spotify est une SPA)
  let currentUrl = window.location.href;
  setInterval(() => {
    if (window.location.href !== currentUrl) {
      currentUrl = window.location.href;
      console.log('🔄 Page changed, re-initializing...');
      setTimeout(init, 1000);
    }
  }, 1000);