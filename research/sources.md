# Источники

Дата сбора: 29.09.2026.

## Официальные документы Yaesu (основа всех инструкций)

| Документ | Ссылка |
|---|---|
| Страница модели FT-70DR (раздел Files) | https://yaesu.com/product-detail.aspx?Model=FT-70DR&CatName=VHF%2FUHF+Handhelds |
| Operating Manual (EN, 1809R-CY-1) | https://www.yaesu.com/Files/DFDF4D53-1B78-7375-E6C7A6E4B192BE13/FT-70DR_DE_OM_ENG_EH051M202_1809R-CY-1.pdf |
| Advance Manual (EN, 1907-F) | https://www.yaesu.com/Files/DFDF4D53-1B78-7375-E6C7A6E4B192BE13/FT-70DR_DE_AM_ENG_1907-F.pdf |
| Firmware Update Information (Rev 1, 11-08-17) | https://www.yaesu.com/Files/BB2B47AE-1018-01AF-FAE48FDCB1919193/FT-70DR%20Firmware%20Update%20Information%20(Rev%201)%2011-08-17.pdf |
| Прошивка MAIN 1.11 для Европы (EXP), с инструкцией | https://www.yaesu.com/Files/BB2B47AE-1018-01AF-FAE48FDCB1919193/FT-70D_ver111(EXP).zip |
| ADMS-10 (программа) | https://www.yaesu.com/Files/BB2B47AE-1018-01AF-FAE48FDCB1919193/FT-70D_ADMS-10_ENG.zip |
| ADMS-10 Instruction Manual (2211-C) | https://www.yaesu.com/Files/DFDF4D53-1B78-7375-E6C7A6E4B192BE13/ADMS-10_FT-70D_IM_ENG_2211-C.pdf |
| Список открытых узлов WIRES-X | https://www.yaesu.com/jp/en/wires-x/index.php |

## Форумы, блоги и сообщества («фишки»)

| # | Источник | Что взято |
|---|---|---|
| F1 | 0x9900.com — «Going digital with the FT-70D» https://0x9900.com/going-digital-with-the-ft-70d/ | Позывной с именем через «/» (W6BSD/FRED); [F]→[AMS] — подключение; удержание [MODE] — выход; удержание [BAND] — отключить комнату; номер комнаты + [AMS] |
| F2 | WB4SON — «DTMF and the FT-70D» https://wb4son.com/wpblog/?p=3406 | Вход в WIRES удаётся не с первого раза (~30% неудач) — повторить; комнату вызывать [AMS], а не PTT; экран «*-----»; DTMF-команды хотспоту у автора не сработали |
| F3 | forum.pistar.uk — «FT-70D not connecting to Wires-X» https://forum.pistar.uk/viewtopic.php?t=4645 | С мультирежимным хотспотом сначала нажать PTT на секунду, чтобы хотспот «зацепился» за YSF, потом [F]→[AMS]; проверить DG-ID (обычно 00); в Pi-Star включить WIRES-X passthrough |
| F4 | CHIRP, задача #5647 https://chirpmyradio.com/issues/5647 | FT-70D поддерживается в CHIRP только через USB-кабель; вход в режим ADMS: без аккумулятора, держать [AMS], подключить питание, затем [BAND] после нажатия «Download»; баг с неполным чтением исправлен в 2018 |
| F5 | CHIRP, задача #9211 https://chirpmyradio.com/issues/9211 | На Linux порт /dev/ttyUSB может не появляться |
| F6 | RadioReference — «FT-70D driver installation» https://forums.radioreference.com/threads/ft-70d-driver-installation.403329/ | Кабель CT-27 — только рация↔рация, не для ПК; при «Timeout» сразу после запуска чтения быстро нажать [BAND] на рации |
| F7 | RadioReference — «Yaesu FT-70D programming issues» https://forums.radioreference.com/threads/yaesu-ft-70d-programming-issues.415012/ | Ошибка «invalid com port» — выбран не тот COM-порт; часть пользователей советует ADMS-10 или RT Systems вместо CHIRP |
| F8 | RT Systems ADMS-70D https://www.rtsystemsinc.com/FT-70D_c_814.html | Платная программа для Windows/Mac |
| F9 | HamOperator — «Battery Hints and the FT-70» https://wp.hamoperator.com/?p=1322 | Рация тянет немного тока даже выключенной — при долгом хранении снимать аккумулятор (совпадает с OM стр. 9: «remove the battery pack») |
| F10 | amqrp.org — Yaesu FT-70DR Review https://amqrp.org/yaesu-ft-70dr/ | Общие впечатления, звук, батарея |

## Фото

| Файл | Лицензия | Автор / ссылка |
|---|---|---|
| `src/assets/ft70de-commons-hensys1.jpg` | CC BY-SA 4.0 | Hensys1, Wikimedia Commons, 20.05.2022 — https://commons.wikimedia.org/wiki/File:FT70DE_sk.jpg |

Других фото FT-70D со свободной лицензией (Wikimedia Commons, Openverse/Flickr CC) на 29.09.2026 не нашлось, в том числе фото в разобранном виде.
Фото с сайта Yaesu и с форумов защищены авторским правом, и по п. 7.5 ТЗ их использовать нельзя. Поэтому в приложении:
1. есть одно настоящее фото (выше), подписанное автором;
2. остальные изображения — собственные SVG-рисунки: передняя панель, бока, «разобранный вид»;
3. есть функция «📷 Фото моей рации»: пользователь добавляет свои снимки, в том числе рации в разобранном виде, они хранятся в IndexedDB на телефоне и показываются фоном и в карточках.

## Репитеры

Смотри `repeaters-sources.md`.
