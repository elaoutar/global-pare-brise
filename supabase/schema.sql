-- ==============================================================================
-- GLOBAL PARE-BRISE - SCHÉMA DE BASE DE DONNÉES SUPABASE
-- Script complet de création des tables, index, RLS et bucket de stockage
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLE DOSSIERS DE SINISTRE
CREATE TABLE IF NOT EXISTS public.dossiers (
    id TEXT PRIMARY KEY,
    numero_dossier TEXT NOT NULL UNIQUE,
    type_dossier TEXT NOT NULL DEFAULT 'ASSURANCE',
    date_creation TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Client & Véhicule stockés en colonnes indexées + JSONB complet
    client JSONB NOT NULL DEFAULT '{}'::jsonb,
    vehicule JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Assurance & Partenaire AZUR GLASS
    assurance JSONB,
    agence_assurance TEXT,
    partenaire JSONB,
    numero_sinistre TEXT,
    numero_police TEXT,
    date_sinistre TEXT,
    
    -- Régime fiscal & Intermédiaire AZUR GLASS
    type_client_assurance TEXT DEFAULT 'PARTICULIER',
    reference_dossier_azur_glass TEXT,
    date_envoi_azur_glass TIMESTAMPTZ,
    
    -- Aspects financiers
    montant_total_ttc NUMERIC(12,2) NOT NULL DEFAULT 0,
    montant_franchise NUMERIC(12,2) NOT NULL DEFAULT 0,
    franchise_payee_par_client BOOLEAN DEFAULT false,
    franchise_offerte BOOLEAN DEFAULT false,
    tva_exclue_par_assurance NUMERIC(12,2) DEFAULT 0,
    montant_reversement_azur_glass NUMERIC(12,2) DEFAULT 0,
    montant_prise_en_charge_assurance NUMERIC(12,2) DEFAULT 0,
    
    -- Avancement
    statut TEXT NOT NULL DEFAULT 'NOUVEAU',
    poseur TEXT,
    observations TEXT,
    
    -- Photos & Documents joints
    photos JSONB DEFAULT '{"avantSinistreUrl": null, "apresPoseUrl": null, "carteGriseUrl": null}'::jsonb,
    documents JSONB DEFAULT '[]'::jsonb,
    
    -- Relations
    bon_sortie_id TEXT,
    bon_livraison_id TEXT,
    facture_assurance_id TEXT,
    facture_client_id TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLE STOCK ARTICLES
CREATE TABLE IF NOT EXISTS public.stock (
    id TEXT PRIMARY KEY,
    reference TEXT NOT NULL UNIQUE,
    code_eurocode TEXT,
    designation TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'PARE_BRISE',
    quantite_en_stock INTEGER NOT NULL DEFAULT 0,
    stock_minimum_alerte INTEGER NOT NULL DEFAULT 2,
    prix_achat_ht NUMERIC(12,2) NOT NULL DEFAULT 0,
    prix_vente_ht NUMERIC(12,2) NOT NULL DEFAULT 0,
    emplacement TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLE FACTURES
CREATE TABLE IF NOT EXISTS public.factures (
    id TEXT PRIMARY KEY,
    numero_facture TEXT NOT NULL UNIQUE,
    dossier_id TEXT NOT NULL,
    destinataire TEXT NOT NULL DEFAULT 'AZUR_GLASS',
    date_emission TEXT NOT NULL,
    date_echeance TEXT NOT NULL,
    lignes JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_ht NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_tva NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_ttc NUMERIC(12,2) NOT NULL DEFAULT 0,
    montant_regle NUMERIC(12,2) NOT NULL DEFAULT 0,
    statut_paiement TEXT NOT NULL DEFAULT 'EN_ATTENTE',
    date_paiement TEXT,
    reference_paiement TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABLE BONS DE SORTIE
CREATE TABLE IF NOT EXISTS public.bons_sortie (
    id TEXT PRIMARY KEY,
    numero_bs TEXT NOT NULL UNIQUE,
    dossier_id TEXT NOT NULL,
    date_sortie TEXT NOT NULL,
    poseur TEXT NOT NULL,
    lignes JSONB NOT NULL DEFAULT '[]'::jsonb,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABLE BONS DE LIVRAISON
CREATE TABLE IF NOT EXISTS public.bons_livraison (
    id TEXT PRIMARY KEY,
    numero_bl TEXT NOT NULL UNIQUE,
    dossier_id TEXT NOT NULL,
    date_livraison TEXT NOT NULL,
    livreur_poseur TEXT NOT NULL,
    receptionnaire_nom TEXT NOT NULL,
    receptionnaire_cin TEXT,
    lignes JSONB NOT NULL DEFAULT '[]'::jsonb,
    observations TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABLE DEVIS CLIENTS
CREATE TABLE IF NOT EXISTS public.devis (
    id TEXT PRIMARY KEY,
    numero_devis TEXT NOT NULL UNIQUE,
    date_devis TEXT NOT NULL,
    date_validite TEXT NOT NULL,
    agence_ville TEXT NOT NULL DEFAULT 'Marrakech',
    client_nom TEXT NOT NULL,
    client_telephone TEXT NOT NULL,
    client_cin TEXT,
    client_email TEXT,
    client_ville TEXT,
    vehicule_marque TEXT NOT NULL,
    vehicule_modele TEXT NOT NULL,
    vehicule_annee INTEGER NOT NULL DEFAULT 2022,
    vehicule_immatriculation TEXT NOT NULL,
    vehicule_chassis_vin TEXT,
    type_demande TEXT NOT NULL DEFAULT 'PARTICULIER_DIRECT',
    compagnie_assurance TEXT,
    lignes JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_ht NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_tva NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_ttc NUMERIC(12,2) NOT NULL DEFAULT 0,
    statut TEXT NOT NULL DEFAULT 'BROUILLON',
    dossier_id_genere TEXT,
    observations TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TABLE RECETTES & ENCAISSEMENTS
CREATE TABLE IF NOT EXISTS public.recettes (
    id TEXT PRIMARY KEY,
    numero_recu TEXT NOT NULL UNIQUE,
    dossier_id TEXT,
    facture_id TEXT,
    payeur_nom TEXT NOT NULL,
    source_type TEXT NOT NULL DEFAULT 'CLIENT',
    mode_paiement TEXT NOT NULL DEFAULT 'ESPECES',
    montant NUMERIC(12,2) NOT NULL DEFAULT 0,
    date_paiement TEXT NOT NULL,
    reference_document TEXT,
    banque TEXT,
    date_echeance TEXT,
    statut TEXT NOT NULL DEFAULT 'ENCAISSE',
    date_encaissement_effectif TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. TABLE FOURNISSEURS
CREATE TABLE IF NOT EXISTS public.fournisseurs (
    id TEXT PRIMARY KEY,
    nom TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    telephone TEXT NOT NULL,
    email TEXT NOT NULL,
    ville TEXT NOT NULL,
    ice TEXT NOT NULL,
    delai_livraison_moyen INTEGER DEFAULT 3,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. TABLE COMMANDES FOURNISSEURS
CREATE TABLE IF NOT EXISTS public.commandes_fournisseurs (
    id TEXT PRIMARY KEY,
    numero_commande TEXT NOT NULL UNIQUE,
    fournisseur_id TEXT NOT NULL,
    date_commande TEXT NOT NULL,
    statut TEXT NOT NULL DEFAULT 'EN_ATTENTE_LIVRAISON',
    statut_paiement TEXT NOT NULL DEFAULT 'NON_PAYE',
    mode_paiement TEXT NOT NULL DEFAULT 'VIREMENT',
    lignes JSONB NOT NULL DEFAULT '[]'::jsonb,
    montant_total_ht NUMERIC(12,2) NOT NULL DEFAULT 0,
    montant_total_ttc NUMERIC(12,2) NOT NULL DEFAULT 0,
    montant_paye NUMERIC(12,2) NOT NULL DEFAULT 0,
    date_livraison_prevue TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. TABLE ASSURANCES
CREATE TABLE IF NOT EXISTS public.assurances (
    id TEXT PRIMARY KEY,
    nom TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    telephone TEXT,
    email TEXT,
    adresse TEXT,
    delai_reglement_moyen_jours INTEGER DEFAULT 45,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. TABLE PARTENAIRES
CREATE TABLE IF NOT EXISTS public.partenaires (
    id TEXT PRIMARY KEY,
    nom TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL DEFAULT 'INTERMEDIAIRE_ASSURANCE',
    contact TEXT,
    telephone TEXT,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 13. POLICIES RLS (ROW LEVEL SECURITY)
-- Permet l'accès complet via la clé publique anonyme (pour votre application web)
-- ==============================================================================
ALTER TABLE public.dossiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.factures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bons_sortie ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bons_livraison ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recettes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fournisseurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commandes_fournisseurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assurances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partenaires ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public all on dossiers" ON public.dossiers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on stock" ON public.stock FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on factures" ON public.factures FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on bons_sortie" ON public.bons_sortie FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on bons_livraison" ON public.bons_livraison FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on devis" ON public.devis FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on recettes" ON public.recettes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on fournisseurs" ON public.fournisseurs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on commandes_fournisseurs" ON public.commandes_fournisseurs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on assurances" ON public.assurances FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on partenaires" ON public.partenaires FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- 14. BUCKET DE STOCKAGE POUR LES FICHIERS ET PHOTOS (Supabase Storage)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('sinistre-documents', 'sinistre-documents', true)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Public Read sinistre-documents" ON storage.objects
FOR SELECT USING (bucket_id = 'sinistre-documents');

CREATE POLICY "Public Insert sinistre-documents" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'sinistre-documents');

CREATE POLICY "Public Update sinistre-documents" ON storage.objects
FOR UPDATE USING (bucket_id = 'sinistre-documents');

CREATE POLICY "Public Delete sinistre-documents" ON storage.objects
FOR DELETE USING (bucket_id = 'sinistre-documents');

-- ==============================================================================
-- 15. TABLE UTILISATEURS & GESTION DES RÔLES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.utilisateurs (
    id TEXT PRIMARY KEY,
    nom TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    mot_de_passe TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'ASSISTANTE',
    agence TEXT NOT NULL DEFAULT 'Marrakech',
    statut TEXT NOT NULL DEFAULT 'ACTIF',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.utilisateurs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public all on utilisateurs" ON public.utilisateurs FOR ALL USING (true) WITH CHECK (true);

-- Comptes initiaux
INSERT INTO public.utilisateurs (id, nom, email, mot_de_passe, role, agence)
VALUES 
('usr-admin-1', 'Direction Générale (Gérant)', 'direction@globaleparebrise.ma', 'GlobalPareBrise2026!', 'SUPERADMIN', 'Marrakech'),
('usr-assistante-1', 'Sanaa (Secrétaire & Opérations)', 'assistante@globaleparebrise.ma', 'Assistante2026!', 'ASSISTANTE', 'Marrakech')
ON CONFLICT (email) DO UPDATE SET mot_de_passe = EXCLUDED.mot_de_passe, role = EXCLUDED.role;

