-- ==============================================================================
-- GLOBAL PARE-BRISE - DONNÉES INITIALES (SEED)
-- ==============================================================================

-- 1. ASSURANCES DU MAROC
INSERT INTO public.assurances (id, nom, code, telephone, email, adresse, delai_reglement_moyen_jours)
VALUES
('ass-1', 'Wafa Assurance', 'WAFA', '05 22 54 55 56', 'sinistres.auto@wafaassurance.co.ma', '1 Boulevard Abdelmoumen, Casablanca', 45),
('ass-2', 'RMA (Royale Marocaine d''Assurance)', 'RMA', '05 22 20 40 40', 'reglements.auto@rma.co.ma', '83 Avenue de l''Armée Royale, Casablanca', 30),
('ass-3', 'Sanlam Maroc (ex-Saham)', 'SANLAM', '05 22 43 56 00', 'gestion.brisdeglace@sanlam.ma', '216 Boulevard Zerktouni, Casablanca', 40),
('ass-4', 'AtlantaSanad', 'ATLANTA', '05 22 95 78 00', 'sinistres@atlantasanad.ma', 'Angle Bd Abdelmoumen et rue Bachir Ibrahimi, Casablanca', 35),
('ass-5', 'AXA Assurance Maroc', 'AXA', '05 22 88 92 92', 'indemnisation.auto@axa.ma', '120-122 Avenue Hassan II, Casablanca', 45),
('ass-6', 'Mutuelle Taamine Chaabi (MAMDA-MCMA)', 'MAMDA', '05 37 21 82 00', 'contact@mamda-mcma.ma', 'Boulevard Al Massira Al Khadra, Rabat', 60)
ON CONFLICT (id) DO NOTHING;

-- 2. PARTENAIRE INTERMÉDIAIRE AZUR GLASS
INSERT INTO public.partenaires (id, nom, code, type, contact, telephone, email)
VALUES
('part-1', 'AZUR GLASS (Intermédiaire Conventionné)', 'AZUR_GLASS', 'INTERMEDIAIRE_ASSURANCE', 'M. Karim Tahiri (Directeur Déclarations)', '05 24 44 33 22 / 06 61 12 34 56', 'contact@azurglass.ma')
ON CONFLICT (id) DO NOTHING;

-- 3. FOURNISSEURS
INSERT INTO public.fournisseurs (id, nom, code, telephone, email, ville, ice, delai_livraison_moyen)
VALUES
('fourn-1', 'Saint-Gobain Autover Maroc', 'AUTOVER', '05 22 66 77 88', 'commandes@autover.ma', 'Casablanca', '001524312000045', 2),
('fourn-2', 'Pilkington Automotive Maghreb', 'PILKINGTON', '05 22 33 44 55', 'maroc@pilkington.com', 'Casablanca', '002145896000078', 3),
('fourn-3', 'Fuyao Glass Morocco', 'FUYAO', '05 24 88 99 00', 'contact@fuyaomaroc.ma', 'Marrakech', '001987456000012', 1),
('fourn-4', 'Sika Maroc (Colles & Consommables)', 'SIKA', '05 22 70 80 90', 'commandes@sika.ma', 'Casablanca', '001654987000034', 2)
ON CONFLICT (id) DO NOTHING;
