# CanopUI — pourquoi la dépendance est en `latest`

- **Date** : 2026-09-25
- **Statut** : décidé et appliqué
- **Portée** : les 4 portails CustHome (CH-Portail-Admin, CH-Portal-Authenticator, CH-Portal-Drive, CH-Portal-Budgy) et ProjectCenter
- **Décision de Martin** : les fronts suivent la dernière CanopUI publiée, sans intervention

> **À lire avant de « sécuriser » la dépendance.** Voir `canopui` en `latest` dans
> `package.json` ressemble à un oubli ou à une imprudence. Ce n'en est pas une : c'est un
> choix pris en connaissance de cause, avec les garde-fous décrits ici. **Ne pas ré-épingler
> `canopui` sur une version fixe sans en parler à Martin d'abord** — et si une montée de
> version casse quelque chose, la réponse est de corriger CanopUI, pas de figer le front.

## Le contexte qui change tout

CanopUI n'est pas une dépendance tierce : c'est **notre** design system, publié par **notre**
CI (tag `vX.Y.Z` du dépôt `QVL-CanopUI`) sur **notre** registre privé (Verdaccio,
`https://npm.qvl-project.com`), consommé par **nos** fronts, sur **notre** machine. Le seul
publieur possible est ce dépôt. Les raisons habituelles d'épingler une dépendance — un
mainteneur inconnu peut publier n'importe quoi, un paquet peut être compromis, une release
peut disparaître — ne s'appliquent pas ici.

**Engagement pris côté CanopUI le 2026-09-25** : la librairie garantit l'intégrité de ce
qu'elle exporte. Une publication n'enlève pas et ne casse pas une API existante ; une montée
de version ne doit donc pas casser un portail. C'est un contrat porté par CanopUI, pas un
espoir côté front. Ce qui suit en découle.

## Ce qui est réellement en place

1. **`package.json` / `package-lock.json`** : `"canopui": "latest"`. Le lock fige quand même
   une version résolue — c'est elle que `npm ci` installe en local, au lint et aux tests.
2. **La CI** installe `canopui@latest` juste avant `npm run build` : l'artefact déployé part
   donc toujours sur la dernière version publiée, même si le lock est plus ancien.
3. **Le build écrit `dist/.canopui-version`** — la version réellement embarquée dans le
   bundle. Elle voyage avec `dist/` jusqu'au dossier servi (`/opt/custhome/ch-portal-drive/dist/`, recopié par le helper `ch-deploy-portal`).
4. **Au démarrage de la machine**, l'unité systemd `canopui-autorebuild` (WSL,
   `/usr/local/bin/canopui-autorebuild`) compare ce marqueur à la dist-tag `latest` du
   registre et **redéclenche la pipeline GitLab** de ce front s'il est en retard, via un
   trigger token dédié (`/etc/qvl/canopui-autorebuild.env`, root 600). Journal :
   `journalctl -u canopui-autorebuild`. En manuel :
   `sudo canopui-autorebuild --dry-run` (voir sans agir), `--force`, ou un nom de front pour
   n'en traiter qu'un.

On héberge tout ici : sans ce mécanisme, une CanopUI publiée ne part en prod que le jour où
quelqu'un repousse du code sur le front. C'est exactement ce qui avait laissé PipeBoard en
`canopui@1.0.1` pendant des mois.

## Les objections prévisibles, et ce qu'on y répond

**« `latest` n'est pas reproductible »** — le lockfile reste versionné et fige une version
résolue : `npm ci` est reproductible en local, au lint et aux tests. Le seul endroit qui
prend délibérément la dernière version est le job de build, et **chaque bundle déployé porte
sa version dans `.canopui-version`** : on sait toujours, sans deviner, quelle CanopUI tourne
en prod.

**« Une version cassée peut partir en prod toute seule »** — le rebuild passe par la
**pipeline complète** (secret-scan, lint et test, puis build ; le job `deploy` dépend de l'artefact du build). Si une nouvelle CanopUI casse ce front, la pipeline est
rouge et **le déploiement n'a pas lieu** : le bundle précédent continue d'être servi. Le
risque réel n'est pas « la prod casse », c'est « la prod reste en retard », et ça se voit
dans PipeBoard.

**« Il faudrait au moins une plage `^X.Y.Z` »** — un caret n'apporterait rien de plus ici :
CanopUI ne publie pas de majeure sans migration accompagnée (la 3.0 a été un chantier
explicite, avec `docs/CHANTIER-3.0.md` et `docs/MIGRATION-FEEDBACK.md` côté librairie), et
le caret bloquerait justement ces majeures — ce qui recréerait la dérive silencieuse qu'on
vient de supprimer.

**« Et si une montée casse quand même un front ? »** — voir la procédure ci-dessous. Le
réflexe attendu est de corriger ou de republier CanopUI, parce que le défaut est dans la
librairie : figer le front cacherait le problème pour tous les autres.

## Si une CanopUI publiée casse ce front

1. **Constater** : pipeline rouge (le déploiement ne s'est pas fait), ou régression visible
   après un déploiement réussi. La version fautive est dans `dist/.canopui-version` du
   bundle servi, et dans le job `build` de la pipeline.
2. **Corriger dans CanopUI** et republier (tag `vX.Y.Z`) : `latest` repart en avant, et le
   prochain démarrage — ou un `sudo canopui-autorebuild --force ch-portal-drive` — rattrape le
   front.
3. **Dépannage immédiat** si la correction demande du temps : faire repointer la dist-tag sur
   la version saine, `npm dist-tag add canopui@X.Y.Z latest --registry https://npm.qvl-project.com`.
   Tous les fronts reviennent alors à cette version, sans toucher à un seul `package.json`.
4. **Épingler le front** est le dernier recours, temporaire et à documenter ici (version,
   date, raison, condition de retour à `latest`).

## Périmètre

Même dispositif sur les 4 portails CustHome (`CH-Portail-Admin`, `CH-Portal-Authenticator`,
`CH-Portal-Drive`, `CH-Portal-Budgy`) et sur `ProjectCenter`.

**PipeBoard est volontairement exclu** : hébergé sur GitHub, sans CI, il n'est pas atteignable
par le runner — son déploiement reste manuel (`sudo tb-deploy-pipeboard`), et son code est
encore sur l'API `Ch*` / MUI 7, donc il casserait au build sur CanopUI 3.x.
