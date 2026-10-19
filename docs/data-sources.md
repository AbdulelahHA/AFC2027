# AFC Asian Cup Saudi Arabia 2027: sources (as of 12 Oct 2026)

Abbreviations used below:
- **PDF-JUN**: the official AFC match schedule, post-draw version dated 5 June 2026. https://assets.the-afc.com/2027_AFC_Asian_Cup/Downloads/Match_Schedule/AC27F_MatchSchedule_5june26.pdf
- **PDF-FEB**: the official AFC match schedule, pre-draw version from Feb 2026. https://assets.the-afc.com/2027_AFC_Asian_Cup/AFC-Asian-Cup-Saudi-Arabia-2027%E2%84%A2_Match-Schedule_Feb-2026.pdf
- **REG23**: the AFC Asian Cup 2023 Competition Regulations (21 Dec 2023). https://assets.the-afc.com/2023_AFC_Asian_Cup/Downloads/AFC-Asian-Cup-2023%E2%84%A2-Competition-Regulations%20(21%20Dec%202023).pdf
- **MAN23**: the AFC Competition Operations Manual, Edition 2023. https://assets.the-afc.com/downloads/miscellaneous-regulations/AFC-Competition-Operations-Manual-(Edition-2023).pdf
- **WIKI**: https://en.wikipedia.org/wiki/2027_AFC_Asian_Cup. Used only as a pointer.

## 1. Dates, size, format
| Fact | Source |
|---|---|
| 7 Jan – 5 Feb 2027, in Saudi Arabia | PDF-JUN (header); AFC "Two-year countdown" 7 Jan 2025: https://www.the-afc.com/en/national/afc_asian_cup.html/news/dates-for-afc-asian-cup-saudi-arabia-2027%E2%84%A2-recommended |
| 24 teams, 51 matches, 8 stadiums, 3 cities (Riyadh 31 matches, Jeddah 13, Al Khobar 7) | Al Jazeera, 29 Sep 2026: https://www.aljazeera.net/sport/2026/9/29/100-يوم-كأس-آسيا-كرة-القدم. The city counts match PDF-JUN, and build.js checks them. |
| 6 groups of 4. Winners, runners-up and the 4 best third-placed teams go to the R16, then QF, SF and Final, all single-leg | PDF-JUN (bracket); REG23 Art. 9.2–9.13 |
| **No third-place match** | PDF-JUN has nothing between the SFs (1–2 Feb) and the Final (5 Feb): 36+8+4+2+1 = 51. REG23 has no 3rd-place playoff either. |
| Extra time of 2x15 min, then penalties | REG23 Art. 10 (2023 edition) |
| Opening match (M1) and Final (M51) at King Fahd Sports City Stadium | PDF-JUN |

## 2. Venues
Names and capacities come from PDF-JUN. Arabic names come from Saudipedia (https://saudipedia.com/ar/كأس-آسيا-2027).

| Code | Official name (PDF-JUN) | Arabic | City | Capacity |
|---|---|---|---|---|
| KFS | King Fahd Sports City Stadium | استاد مدينة الملك فهد الرياضية | Riyadh | 72,000 |
| KSU | King Saud University Stadium | ملعب جامعة الملك سعود | Riyadh | 26,000 |
| KAR | Kingdom Arena | ملعب المملكة أرينا | Riyadh | 26,000 |
| IMU | Imam Mohammed Bin Saud University Stadium | ملعب جامعة الإمام محمد بن سعود | Riyadh | 25,000 |
| SHB | Al Shabab Stadium | ملعب نادي الشباب | Riyadh | 13,000 |
| KAS | King Abdullah Sports City Stadium | استاد مدينة الملك عبدالله الرياضية | Jeddah | 60,000 |
| PAF | Prince Abdullah Al Faisal Sports City Stadium | استاد مدينة الأمير عبدالله الفيصل الرياضية | Jeddah | 26,000 |
| ARM | Aramco Stadium | استاد أرامكو | Al Khobar | 45,000 |

Conflicts:
- WIKI gives different capacities: KFS 70,000, KSU 25,000, Imam 21,000, Al Shabab 14,000, PAF 25,000. I used the AFC figures.
- PDF-FEB names the Khobar venue only "Al Khobar" and spells the Riyadh stadium "Imam Mohammed **Ibn** Saud". PDF-JUN uses "Aramco Stadium" and "Imam Mohammed **Bin** Saud". I used PDF-JUN.
- The capacity figures in the Al Jazeera / AFP coverage (72k, 26k, 26k, 25k, 13k, 60k, 26k, 45k) match PDF-JUN.

## 3. Teams
| Fact | Source |
|---|---|
| All 24 teams, groups and positions A1–F4, with AFC 3-letter codes (KSA, KUW, OMA, PLE / UZB, BHR, PRK, JOR / IRN, SYR, KGZ, CHN / AUS, TJK, IRQ, SGP / KOR, UAE, VIE, YEM / JPN, QAT, THA, IDN) | PDF-JUN (group legend) |
| Singapore's FIFA code is **SGP**. "SIN" is listed as obsolete. | https://en.wikipedia.org/wiki/List_of_FIFA_country_codes (FIFA members table shows SGP; obsolete codes table shows SIN). AFC also uses SGP (PDF-JUN). |
| Qualification dates; Yemen was the last team to qualify (4 Jun 2026) | WIKI (qualified teams table); Yemen at E4 in PDF-JUN |
| Flag codes (lowercase ISO 3166-1 alpha-2) | Checked against https://flagcdn.com/en/codes.json: sa kw om ps uz bh kp jo ir sy kg cn au tj iq sg kr ae vn ye jp qa th id |
| Arabic team names | Saudipedia (https://saudipedia.com/ar/كأس-آسيا-2027) |
| Sub-regions (West=WAFF, Central=CAFA, East=EAFF, ASEAN=AFF) | Member lists on https://en.wikipedia.org/wiki/West_Asian_Football_Federation, .../Central_Asian_Football_Association, .../East_Asian_Football_Federation, .../ASEAN_Football_Federation. Australia is an AFF member, so it is ASEAN. No South Asian (SAFF) team qualified, per WIKI. |

## 4. Final draw
| Fact | Source |
|---|---|
| Held Sat 9 May 2026 at 21:00 Saudi time, Salwa Palace, At-Turaif District, Diriyah | Al Etihad/WAM, 4 May 2026: https://en.aletihad.ae/amp/news/sport/4663017/afc-asian-cup-2027-draw-details-announced--uae-in-second-pot; ESPN, 10 May 2026: https://africa.espn.com/football/story/_/id/48727844/afc-asian-cup-draw-japan-face-qatar-south-korea-play-vietnam-socceroos-play-iraq |
| Originally set for 11 Apr 2026, then moved | AFC, 15 Apr 2026: https://www.the-afc.com/en/national/afc_asian_cup.html/news/new-date-for-afc-asian-cup-saudi-arabia-2027%E2%84%A2-final-draw-confirmed; PDF-FEB footer |
| Pots. Pot 1: KSA, JPN, IRN, KOR, AUS, UZB. Pot 2: UAE, QAT, IRQ, JOR, OMA, SYR. Pot 3: BHR, THA, CHN, PLE, VIE, TJK. Pot 4: KGZ, PRK, IDN, KUW, SGP, and the Lebanon/Yemen winner | Al Etihad/WAM, 4 May 2026 (link above) |
| Groups and positions | PDF-JUN; ESPN confirms the same groups |

## 5. Schedule
- All 51 match numbers, dates, venues, pairings and team order are taken from PDF-JUN.
- Knockout slot codes are copied exactly as AFC prints them: 2A v 2C (M37), 1B v 3ACD (M38), 1D v 3BEF (M39), 1A v 3CDE (M40), 1F v 2E (M41), 2B v 2F (M42), 1E v 2D (M43), 1C v 3ABF (M44); QF W37 v W39, W38 v W41, W44 v W43, W40 v W42; SF W45 v W46, W47 v W48; Final W49 v W50 (labelled "FINAL" in the PDF).
- The ticketing aggregator https://arenahub.sa/tournaments/afc-asian-cup-2027?lang=en lists the same pairings and venues. It is not the official ticketing channel; Ahlan is, per Malay Mail: https://www.malaymail.com/news/sports/2026/05/11/afc-asian-cup-saudi-arabia-2027-tickets-go-on-sale-after-final-draw-in-riyadh/219511.

**Kick-off times are UNKNOWN.** No official AFC kick-off list was found.
- WIKI and Arena Hub give 20:00 for M1. Arena Hub also gives 20:00 for M13 and M27, and "TBA" for every other match.
- Wego and footballpath2026 say "19:00 for most matches". This is unverified.

Conflicts with WIKI:
- M2: WIKI has "Oman v Kuwait". PDF-JUN has KUW v OMA (slot A2 v A3). I used PDF-JUN.
- M14: WIKI has 13 Jan. PDF-JUN and Arena Hub have 12 Jan.
- M26 and M28: WIKI has 18 Jan. PDF-JUN and Arena Hub have 17 Jan.

## 6. Third-place table and tie-breakers
- **I could not find the 2027 Competition Regulations.** A search found nothing, and guessed URLs on assets.the-afc.com returned 403. I used the 2023 edition, which has the same format.
- The 2027 R16 bracket in PDF-JUN is the same as REG23 Art. 9.9.
- The 15-row combination table comes from REG23 Art. 9.10 (pp. 26–27). Example from the regulations: if the thirds of A, B, C and D qualify, the pairings are 1A v 3C, 1B v 3D, 1C v 3A, 1D v 3B. The table on WIKI is identical.
- Group tie-breakers come from REG23 Art. 7.3.
- Ranking of third-placed teams comes from REG23 Art. 7.4, which refers to MAN23 Appendix 2, §1.1: points, then goal difference, then goals scored, then disciplinary points, then drawing of lots.
- When there is no 3rd/4th-place playoff, the AFC ranks the losing semi-finalists with MAN23 p. 88 criteria (goal difference in the semi-finals, and so on). This only matters for the website if you show a final ranking.

## 7. Broadcast
| Fact | Source |
|---|---|
| beIN holds MENA rights to AFC competitions "over three cycles up to 2032". For 2022–2024 this **excluded Saudi Arabia, UAE, Iran and Iraq**. | AFC, 6 Oct 2022: https://www.the-afc.com/en/more/afc_news/news/afc_and_bein_media_group_agree_landmark_new_long-term_deal_in_mena_up_to_2032_1.html |
| WIKI lists beIN Sports for MENA for 2027 | WIKI (cites the AFC article above) |
| beIN MENA posted about the 2027 draw | https://x.com/beINSPORTS_EN/status/2053231338732363952 |
| SSC held exclusive Saudi AFC rights for 2021–2024, including the 2023 Asian Cup | Arab News: https://arabnews.pk/node/1837821; Insider Sport, 7 Apr 2021: https://insidersport.com/2021/04/07/saudi-sports-company-awarded-afc-media-package/ |
| **The 2027 rights holder for Saudi Arabia is UNKNOWN.** I found no official AFC, beIN or SSC announcement. | — |

## 8. History (`history` object)
- **Winners.** JPN 4 (1992, 2000, 2004, 2011), KSA 3 (1984, 1988, 1996), IRN 3 (1968, 1972, 1976), KOR 2 (1956, 1960), QAT 2 (2019, 2023), KUW 1 (1980), IRQ 1 (2007), AUS 1 (2015).
  - Source: https://en.wikipedia.org/wiki/AFC_Asian_Cup ("Teams reaching the top four").
  - The "previous best" column in the WIKI qualified-teams table agrees.
  - I did not check against an official AFC page.
- **All-time scorers, through the 2023 edition.** Daei 14, Almoez Ali 11, Lee Dong-gook 10, Takahara 9, Mabkhout 9, Afif 9, Al-Huwaidi 8, Younis Mahmoud 8, Azmoun 8.
  - Pre-2023 totals: Goal.com, 12 Jan 2024: https://www.goal.com/en/lists/who-are-all-time-asian-cup-top-scorers/blt7a86f9537f1cdeda (Daei 14, Lee 10, Almoez 9, Mabkhout 9, Takahara 9, Younis 8, Al-Huwaidi 8).
  - 2023 goals: https://en.wikipedia.org/wiki/2023_AFC_Asian_Cup (goalscorers: Afif 8, Almoez 2, Azmoun 2, Mabkhout 0).
  - Azmoun's earlier goals: 2015 = 2 (https://en.wikipedia.org/wiki/2015_AFC_Asian_Cup) and 2019 = 4 (https://en.wikipedia.org/wiki/2019_AFC_Asian_Cup).
  - The resulting totals match https://en.wikipedia.org/wiki/AFC_Asian_Cup_records_and_statistics.
  - **No official AFC all-time list was found.**
- **activeScorers.** Almoez Ali, Akram Afif and Sardar Azmoun are marked "still active at international level" on the records page above.
  - Ali Mabkhout is not marked active, so his status is UNKNOWN and I left him out.
  - 2027 squads have not been announced.

## Unknowns
1. Kick-off times for all 51 matches (`kickoffLocal: null`).
2. The Saudi Arabia broadcast rights holder. MENA (beIN) is only partially confirmed for the 2025–28 cycle territories.
3. The 2027 Competition Regulations. 2023 is used instead, and the bracket is confirmed identical.
4. Ali Mabkhout's active status.
5. An official AFC source for the history and scorer data. Wikipedia and Goal.com were used.

## Conflicts (summary)
- **Capacities:** WIKI differs from AFC for 5 venues. AFC was used.
- **M2 home/away and dates of M14, M26, M28:** WIKI differs from the AFC PDF. AFC was used.
- **Venue naming:** "Al Khobar" and "Ibn Saud" in the Feb PDF become "Aramco Stadium" and "Bin Saud" in the Jun PDF.
- **Singapore code:** WIKI pages use SIN in places. FIFA's current code is SGP, and AFC also uses SGP.
- **Pre-draw numbering:** in PDF-FEB the group-match slots were not yet assigned to venues. It footnoted a draw on 11 April 2026, which later moved to 9 May.

## Head-to-head (`h2h.json`)
- **What counts:** competitive men's senior meetings between the two teams: Asian Cup, Arab Cup, Gulf Cup, World Cup and World Cup qualifiers. No friendlies, no Asian Cup qualifiers.
- **Sources:** every match is in two independent datasets: [eloratings.net](https://www.eloratings.net) match records and [martj42/international_results](https://github.com/martj42/international_results) (same score, date within a day). Neither is an official source; FIFA's and AFC's sites can't be read in bulk.
- **Disagreements** are settled against a reference page and recorded in `h2h-overrides.json` with the link. Checked on 2026-10-20: 251 matches, 2 disagreements. BHR-UZB 2005-09-03 is excluded: FIFA annulled it and ordered a replay ([Wikipedia](https://en.wikipedia.org/wiki/2006_FIFA_World_Cup_qualification_%E2%80%93_AFC_fourth_round)). KSA-PLE 1992 Arab Cup is kept on its RSSSF date of 9 Sep ([RSSSF](https://rsssf.org/tablesa/arabcup92-details.html)), noted there as not rated internationally because Palestine had not joined FIFA.
- **Known limits:** Yemen and Vietnam matches from before unification are not counted (the sources list North/South separately). Pairs with no meeting (AUS-SGP, IRQ-TJK, KOR-YEM) show no tab.
- **Refreshing:** `npm run h2h` rebuilds the file from both sources, keeps each pair's `approved` flag, and stops on any new disagreement.

