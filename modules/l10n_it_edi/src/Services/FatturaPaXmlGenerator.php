<?php

namespace Modules\L10nItEdi\Services;

use DOMDocument;
use DOMElement;
use Modules\Invoicing\Models\Invoice;
use Modules\Invoicing\Models\InvoiceLine;
use Modules\Contacts\Models\Contact;
use Illuminate\Support\Carbon;

class FatturaPaXmlGenerator
{
    protected Invoice $invoice;
    protected Contact $seller;
    protected Contact $buyer;
    protected array $config;

    protected const NAMESPACE_URI = 'http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2';
    protected const NAMESPACE_DS = 'http://www.w3.org/2000/09/xmldsig#';
    protected const SCHEMA_LOCATION = 'http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2 http://www.fatturapa.gov.it/export/fatturazione/sdi/fatturapa/v1.2/Schema_del_file_xml_FatturaPA_versione_1.2.xsd';

    public function __construct()
    {
        $this->config = config('l10n_it_edi');
    }

    public function generate(Invoice $invoice): string
    {
        $this->invoice = $invoice;
        $this->seller = $this->getCompanyContact();
        $this->buyer = $invoice->contact;

        $dom = new DOMDocument('1.0', 'UTF-8');
        $dom->formatOutput = true;

        $root = $this->createRootElement($dom);
        $dom->appendChild($root);

        $this->addHeader($root);
        $this->addBody($root);

        return $dom->saveXML();
    }

    protected function createRootElement(DOMDocument $dom): DOMElement
    {
        $formatoTrasmissione = $this->getFormatoTrasmissione();
        
        $root = $dom->createElementNS(self::NAMESPACE_URI, 'p:FatturaElettronica');
        $root->setAttribute('versione', $formatoTrasmissione);
        $root->setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns:ds', self::NAMESPACE_DS);
        $root->setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance');
        $root->setAttributeNS('http://www.w3.org/2001/XMLSchema-instance', 'xsi:schemaLocation', self::SCHEMA_LOCATION);

        return $root;
    }

    protected function addHeader(DOMElement $root): void
    {
        $dom = $root->ownerDocument;
        $header = $dom->createElement('FatturaElettronicaHeader');
        $root->appendChild($header);

        $this->addDatiTrasmissione($header);
        $this->addCedentePrestatore($header);
        $this->addCessionarioCommittente($header);
    }

    protected function addDatiTrasmissione(DOMElement $header): void
    {
        $dom = $header->ownerDocument;
        $datiTrasmissione = $dom->createElement('DatiTrasmissione');
        $header->appendChild($datiTrasmissione);

        // IdTrasmittente
        $idTrasmittente = $dom->createElement('IdTrasmittente');
        $datiTrasmissione->appendChild($idTrasmittente);
        $this->addElement($idTrasmittente, 'IdPaese', 'IT');
        $this->addElement($idTrasmittente, 'IdCodice', $this->config['company']['codice_fiscale'] ?? $this->config['company']['partita_iva']);

        // ProgressivoInvio - unique identifier for this transmission
        $progressivo = $this->generateProgressivoInvio();
        $this->addElement($datiTrasmissione, 'ProgressivoInvio', $progressivo);

        // FormatoTrasmissione
        $this->addElement($datiTrasmissione, 'FormatoTrasmissione', $this->getFormatoTrasmissione());

        // CodiceDestinatario
        $codiceDestinatario = $this->buyer->l10n_it_pa_index ?? '0000000';
        $this->addElement($datiTrasmissione, 'CodiceDestinatario', $codiceDestinatario);

        // PECDestinatario (if B2B and no PA index)
        if ($codiceDestinatario === '0000000' && $this->buyer->l10n_it_pec_email) {
            $this->addElement($datiTrasmissione, 'PECDestinatario', $this->buyer->l10n_it_pec_email);
        }
    }

    protected function addCedentePrestatore(DOMElement $header): void
    {
        $dom = $header->ownerDocument;
        $cedente = $dom->createElement('CedentePrestatore');
        $header->appendChild($cedente);

        // DatiAnagrafici
        $datiAnagrafici = $dom->createElement('DatiAnagrafici');
        $cedente->appendChild($datiAnagrafici);

        // IdFiscaleIVA
        $idFiscale = $dom->createElement('IdFiscaleIVA');
        $datiAnagrafici->appendChild($idFiscale);
        $this->addElement($idFiscale, 'IdPaese', 'IT');
        $this->addElement($idFiscale, 'IdCodice', $this->config['company']['partita_iva']);

        // CodiceFiscale
        if ($codiceFiscale = $this->config['company']['codice_fiscale']) {
            $this->addElement($datiAnagrafici, 'CodiceFiscale', $codiceFiscale);
        }

        // Anagrafica
        $anagrafica = $dom->createElement('Anagrafica');
        $datiAnagrafici->appendChild($anagrafica);
        $this->addElement($anagrafica, 'Denominazione', $this->truncate($this->seller->name, 80));

        // RegimeFiscale
        $this->addElement($datiAnagrafici, 'RegimeFiscale', $this->config['company']['regime_fiscale'] ?? 'RF01');

        // Sede
        $this->addSede($cedente, $this->seller);

        // IscrizioneREA (optional)
        if ($this->config['company']['rea_office'] ?? null) {
            $this->addIscrizioneREA($cedente);
        }
    }

    protected function addCessionarioCommittente(DOMElement $header): void
    {
        $dom = $header->ownerDocument;
        $cessionario = $dom->createElement('CessionarioCommittente');
        $header->appendChild($cessionario);

        // DatiAnagrafici
        $datiAnagrafici = $dom->createElement('DatiAnagrafici');
        $cessionario->appendChild($datiAnagrafici);

        // IdFiscaleIVA (if VAT number exists)
        if ($this->buyer->vat) {
            $idFiscale = $dom->createElement('IdFiscaleIVA');
            $datiAnagrafici->appendChild($idFiscale);
            $vatCountry = substr($this->buyer->vat, 0, 2);
            $vatNumber = substr($this->buyer->vat, 2);
            $this->addElement($idFiscale, 'IdPaese', $vatCountry ?: 'IT');
            $this->addElement($idFiscale, 'IdCodice', $vatNumber ?: $this->buyer->vat);
        }

        // CodiceFiscale
        if ($this->buyer->l10n_it_codice_fiscale) {
            $this->addElement($datiAnagrafici, 'CodiceFiscale', $this->buyer->l10n_it_codice_fiscale);
        }

        // Anagrafica
        $anagrafica = $dom->createElement('Anagrafica');
        $datiAnagrafici->appendChild($anagrafica);
        
        if ($this->buyer->is_company) {
            $this->addElement($anagrafica, 'Denominazione', $this->truncate($this->buyer->name, 80));
        } else {
            // Split name for individuals
            $nameParts = $this->splitName($this->buyer->name);
            $this->addElement($anagrafica, 'Nome', $this->truncate($nameParts['first'], 60));
            $this->addElement($anagrafica, 'Cognome', $this->truncate($nameParts['last'], 60));
        }

        // Sede
        $this->addSede($cessionario, $this->buyer);
    }

    protected function addSede(DOMElement $parent, Contact $contact): void
    {
        $dom = $parent->ownerDocument;
        $sede = $dom->createElement('Sede');
        $parent->appendChild($sede);

        $address = trim(($contact->street ?? '') . ' ' . ($contact->street2 ?? ''));
        $this->addElement($sede, 'Indirizzo', $this->truncate($address ?: 'N/A', 60));
        $this->addElement($sede, 'CAP', $this->formatCAP($contact->postal_code));
        $this->addElement($sede, 'Comune', $this->truncate($contact->city ?? 'N/A', 60));
        
        if ($contact->state) {
            $this->addElement($sede, 'Provincia', strtoupper(substr($contact->state, 0, 2)));
        }
        
        $this->addElement($sede, 'Nazione', $contact->country_code ?? 'IT');
    }

    protected function addIscrizioneREA(DOMElement $cedente): void
    {
        $dom = $cedente->ownerDocument;
        $iscrizioneREA = $dom->createElement('IscrizioneREA');
        $cedente->appendChild($iscrizioneREA);

        $this->addElement($iscrizioneREA, 'Ufficio', $this->config['company']['rea_office']);
        $this->addElement($iscrizioneREA, 'NumeroREA', $this->config['company']['rea_number']);
        
        if ($shareCapital = $this->config['company']['share_capital']) {
            $this->addElement($iscrizioneREA, 'CapitaleSociale', $this->formatDecimal($shareCapital, 2));
        }
        
        if (($soleShareholder = $this->config['company']['sole_shareholder']) && $soleShareholder !== 'NO') {
            $this->addElement($iscrizioneREA, 'SocioUnico', $soleShareholder);
        }
        
        $this->addElement($iscrizioneREA, 'StatoLiquidazione', $this->config['company']['liquidation_state'] ?? 'LN');
    }

    protected function addBody(DOMElement $root): void
    {
        $dom = $root->ownerDocument;
        $body = $dom->createElement('FatturaElettronicaBody');
        $root->appendChild($body);

        $this->addDatiGenerali($body);
        $this->addDatiBeniServizi($body);
        $this->addDatiPagamento($body);
    }

    protected function addDatiGenerali(DOMElement $body): void
    {
        $dom = $body->ownerDocument;
        $datiGenerali = $dom->createElement('DatiGenerali');
        $body->appendChild($datiGenerali);

        // DatiGeneraliDocumento
        $datiDoc = $dom->createElement('DatiGeneraliDocumento');
        $datiGenerali->appendChild($datiDoc);

        // TipoDocumento
        $tipoDocumento = $this->getTipoDocumento();
        $this->addElement($datiDoc, 'TipoDocumento', $tipoDocumento);

        // Divisa
        $this->addElement($datiDoc, 'Divisa', $this->invoice->currency?->code ?? 'EUR');

        // Data
        $this->addElement($datiDoc, 'Data', $this->invoice->invoice_date->format('Y-m-d'));

        // Numero
        $this->addElement($datiDoc, 'Numero', $this->truncate($this->invoice->number, 20));

        // DatiBollo (stamp duty)
        if ($this->invoice->l10n_it_stamp_duty > 0) {
            $datiBollo = $dom->createElement('DatiBollo');
            $datiDoc->appendChild($datiBollo);
            $this->addElement($datiBollo, 'BolloVirtuale', 'SI');
            $this->addElement($datiBollo, 'ImportoBollo', $this->formatDecimal($this->invoice->l10n_it_stamp_duty, 2));
        }

        // ImportoTotaleDocumento
        $this->addElement($datiDoc, 'ImportoTotaleDocumento', $this->formatDecimal($this->invoice->amount_total, 2));

        // DatiOrdineAcquisto / DatiContratto / DatiConvenzione
        if ($this->invoice->l10n_it_origin_document_type) {
            $this->addOriginDocument($datiGenerali);
        } elseif ($this->invoice->ref) {
            $datiOrdine = $dom->createElement('DatiOrdineAcquisto');
            $datiGenerali->appendChild($datiOrdine);
            $this->addElement($datiOrdine, 'IdDocumento', $this->truncate($this->invoice->ref, 20));
        }

        // DatiDDT
        if ($this->invoice->l10n_it_ddt_number) {
            $datiDDT = $dom->createElement('DatiDDT');
            $datiGenerali->appendChild($datiDDT);
            $this->addElement($datiDDT, 'NumeroDDT', $this->truncate($this->invoice->l10n_it_ddt_number, 20));
            if ($this->invoice->l10n_it_ddt_date) {
                $this->addElement($datiDDT, 'DataDDT', $this->invoice->l10n_it_ddt_date->format('Y-m-d'));
            }
        }
    }

    protected function addOriginDocument(DOMElement $datiGenerali): void
    {
        $dom = $datiGenerali->ownerDocument;
        
        $elementName = match ($this->invoice->l10n_it_origin_document_type) {
            'purchase_order' => 'DatiOrdineAcquisto',
            'contract' => 'DatiContratto',
            'agreement' => 'DatiConvenzione',
            default => 'DatiOrdineAcquisto',
        };

        $element = $dom->createElement($elementName);
        $datiGenerali->appendChild($element);

        if ($this->invoice->l10n_it_origin_document_name) {
            $this->addElement($element, 'IdDocumento', $this->truncate($this->invoice->l10n_it_origin_document_name, 20));
        }
        if ($this->invoice->l10n_it_origin_document_date) {
            $this->addElement($element, 'Data', $this->invoice->l10n_it_origin_document_date->format('Y-m-d'));
        }
        if ($this->invoice->l10n_it_cup) {
            $this->addElement($element, 'CodiceCUP', $this->truncate($this->invoice->l10n_it_cup, 15));
        }
        if ($this->invoice->l10n_it_cig) {
            $this->addElement($element, 'CodiceCIG', $this->truncate($this->invoice->l10n_it_cig, 15));
        }
    }

    protected function addDatiBeniServizi(DOMElement $body): void
    {
        $dom = $body->ownerDocument;
        $datiBeni = $dom->createElement('DatiBeniServizi');
        $body->appendChild($datiBeni);

        // Add lines
        $lineNumber = 0;
        foreach ($this->invoice->lines as $line) {
            if ($line->display_type !== 'product') {
                continue;
            }
            $lineNumber++;
            $this->addDettaglioLinee($datiBeni, $line, $lineNumber);
        }

        // Add tax summary (DatiRiepilogo)
        $this->addDatiRiepilogo($datiBeni);
    }

    protected function addDettaglioLinee(DOMElement $datiBeni, InvoiceLine $line, int $lineNumber): void
    {
        $dom = $datiBeni->ownerDocument;
        $dettaglio = $dom->createElement('DettaglioLinee');
        $datiBeni->appendChild($dettaglio);

        $this->addElement($dettaglio, 'NumeroLinea', (string)$lineNumber);

        // CodiceArticolo
        if ($line->product?->code) {
            $codiceArticolo = $dom->createElement('CodiceArticolo');
            $dettaglio->appendChild($codiceArticolo);
            $this->addElement($codiceArticolo, 'CodiceTipo', 'INTERNAL');
            $this->addElement($codiceArticolo, 'CodiceValore', $this->truncate($line->product->code, 35));
        }

        // Descrizione
        $descrizione = $line->name ?: $line->product?->name ?: 'Prodotto/Servizio';
        $this->addElement($dettaglio, 'Descrizione', $this->truncate($descrizione, 1000));

        // Quantita
        $this->addElement($dettaglio, 'Quantita', $this->formatDecimal($line->quantity, 8));

        // PrezzoUnitario
        $this->addElement($dettaglio, 'PrezzoUnitario', $this->formatDecimal($line->price_unit, 8));

        // ScontoMaggiorazione
        if ($line->discount > 0) {
            $sconto = $dom->createElement('ScontoMaggiorazione');
            $dettaglio->appendChild($sconto);
            $this->addElement($sconto, 'Tipo', 'SC');
            $this->addElement($sconto, 'Percentuale', $this->formatDecimal($line->discount, 2));
        }

        // PrezzoTotale
        $this->addElement($dettaglio, 'PrezzoTotale', $this->formatDecimal($line->price_subtotal, 8));

        // AliquotaIVA
        $taxRate = $this->getLineTaxRate($line);
        $this->addElement($dettaglio, 'AliquotaIVA', $this->formatDecimal($taxRate, 2));

        // Natura (for zero-rate taxes)
        if ($taxRate == 0) {
            $natura = $this->getLineNatura($line);
            if ($natura) {
                $this->addElement($dettaglio, 'Natura', $natura);
            }
        }
    }

    protected function addDatiRiepilogo(DOMElement $datiBeni): void
    {
        $dom = $datiBeni->ownerDocument;
        
        // Group by tax rate
        $taxSummary = $this->calculateTaxSummary();

        foreach ($taxSummary as $rate => $data) {
            $riepilogo = $dom->createElement('DatiRiepilogo');
            $datiBeni->appendChild($riepilogo);

            $this->addElement($riepilogo, 'AliquotaIVA', $this->formatDecimal($rate, 2));
            
            if ($data['natura']) {
                $this->addElement($riepilogo, 'Natura', $data['natura']);
            }

            $this->addElement($riepilogo, 'ImponibileImporto', $this->formatDecimal($data['base'], 2));
            $this->addElement($riepilogo, 'Imposta', $this->formatDecimal($data['tax'], 2));
            $this->addElement($riepilogo, 'EsigibilitaIVA', $data['esigibilita'] ?? 'I'); // I = Immediata, D = Differita, S = Scissione

            if ($data['riferimento_normativo']) {
                $this->addElement($riepilogo, 'RiferimentoNormativo', $this->truncate($data['riferimento_normativo'], 100));
            }
        }
    }

    protected function addDatiPagamento(DOMElement $body): void
    {
        $dom = $body->ownerDocument;
        
        // Only add payment data for invoices (not credit notes)
        if ($this->invoice->move_type === 'out_refund') {
            return;
        }

        $datiPagamento = $dom->createElement('DatiPagamento');
        $body->appendChild($datiPagamento);

        // CondizioniPagamento: TP01 = rate, TP02 = completo, TP03 = anticipo
        $this->addElement($datiPagamento, 'CondizioniPagamento', 'TP02');

        // DettaglioPagamento
        $dettaglio = $dom->createElement('DettaglioPagamento');
        $datiPagamento->appendChild($dettaglio);

        // ModalitaPagamento
        $paymentMethod = $this->config['fatturapa']['payment_methods'][$this->invoice->payment_method ?? 'bank_transfer'] ?? 'MP05';
        $this->addElement($dettaglio, 'ModalitaPagamento', $paymentMethod);

        // DataScadenzaPagamento
        if ($this->invoice->invoice_date_due) {
            $this->addElement($dettaglio, 'DataScadenzaPagamento', $this->invoice->invoice_date_due->format('Y-m-d'));
        }

        // ImportoPagamento
        $this->addElement($dettaglio, 'ImportoPagamento', $this->formatDecimal($this->invoice->amount_total, 2));

        // IBAN (if available)
        // This would require adding bank account to the company settings
    }

    // Helper methods

    protected function addElement(DOMElement $parent, string $name, string $value): void
    {
        $element = $parent->ownerDocument->createElement($name, htmlspecialchars($value, ENT_XML1));
        $parent->appendChild($element);
    }

    protected function getFormatoTrasmissione(): string
    {
        // FPA12 for PA, FPR12 for B2B
        if ($this->buyer->l10n_it_is_pa || strlen($this->buyer->l10n_it_pa_index ?? '') === 6) {
            return 'FPA12';
        }
        return 'FPR12';
    }

    protected function getTipoDocumento(): string
    {
        return $this->config['fatturapa']['document_types'][$this->invoice->move_type] ?? 'TD01';
    }

    protected function generateProgressivoInvio(): string
    {
        // Unique identifier: last 10 chars of invoice number without slashes
        return substr(preg_replace('/[^A-Za-z0-9]/', '', $this->invoice->number), -10);
    }

    protected function getCompanyContact(): Contact
    {
        // Return the company's contact (you may need to implement this based on your setup)
        return Contact::where('is_company', true)
            ->where('company_id', $this->invoice->company_id)
            ->first() ?? new Contact([
                'name' => config('app.name'),
                'is_company' => true,
            ]);
    }

    protected function getLineTaxRate(InvoiceLine $line): float
    {
        // Get tax rate from line taxes
        if ($line->taxes && $line->taxes->isNotEmpty()) {
            $tax = $line->taxes->first();
            return $tax->amount ?? 0;
        }
        return 0;
    }

    protected function getLineNatura(InvoiceLine $line): ?string
    {
        // Get natura code for zero-rate taxes
        if ($line->taxes && $line->taxes->isNotEmpty()) {
            $tax = $line->taxes->first();
            return $tax->l10n_it_natura?->natura_code ?? null;
        }
        return null;
    }

    protected function calculateTaxSummary(): array
    {
        $summary = [];

        foreach ($this->invoice->lines as $line) {
            if ($line->display_type !== 'product') {
                continue;
            }

            $rate = $this->getLineTaxRate($line);
            $key = (string)$rate;

            if (!isset($summary[$key])) {
                $summary[$key] = [
                    'base' => 0,
                    'tax' => 0,
                    'natura' => $this->getLineNatura($line),
                    'esigibilita' => 'I',
                    'riferimento_normativo' => null,
                ];
            }

            $summary[$key]['base'] += $line->price_subtotal;
            $summary[$key]['tax'] += $line->tax_amount ?? ($line->price_subtotal * $rate / 100);
        }

        return $summary;
    }

    protected function truncate(string $value, int $length): string
    {
        if ($length < 0) {
            // Negative length means take from the end
            return substr($value, $length);
        }
        return mb_substr($value, 0, $length);
    }

    protected function formatDecimal(float $value, int $decimals): string
    {
        return number_format($value, $decimals, '.', '');
    }

    protected function formatCAP(?string $cap): string
    {
        $cap = preg_replace('/[^0-9]/', '', $cap ?? '');
        return str_pad(substr($cap, 0, 5), 5, '0', STR_PAD_LEFT);
    }

    protected function splitName(string $name): array
    {
        $parts = explode(' ', trim($name), 2);
        return [
            'first' => $parts[0] ?? '',
            'last' => $parts[1] ?? $parts[0] ?? '',
        ];
    }
}
