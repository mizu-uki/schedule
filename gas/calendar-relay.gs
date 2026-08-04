/**
 * デイプランナー用 Googleカレンダー中継（読み取り専用）
 *
 * ブラウザから Googleカレンダーは直接読めない（CORSで弾かれる）ため、
 * Apps Script を挟んで「指定日の予定」だけを JSON で返す。
 * カレンダーへの書き込みは一切しない。
 *
 * ── セットアップ ──────────────────────────────
 * 1) https://script.google.com/ で新しいプロジェクトを作り、このコードを貼り付ける
 * 2) 下の KEY を自分だけが知る文字列に書き換える（プランナー側にも同じ文字列を入れる）
 * 3) 右上「デプロイ」→「新しいデプロイ」→ 種類は「ウェブアプリ」
 *      次のユーザーとして実行 : 自分
 *      アクセスできるユーザー : 全員
 * 4) 表示された「ウェブアプリのURL」（…/exec）をコピーし、
 *    プランナーのサイドバー「⚙ 連携URLを設定」に貼り付ける
 *
 * ※「アクセスできるユーザー: 全員」でもURLは推測できない。加えて KEY が一致しないと
 *   何も返さないので、URLだけ漏れても中身は見られない。
 */

const KEY = 'ここを自分で決めた合言葉に書き換える';

// 取り込むカレンダー（このIDのものだけを見る）。
// 空配列にすると、実行アカウントが持つ全カレンダーが対象になる。
const TARGET_CALENDARS = ['dpd99m@gmail.com'];

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.key !== KEY) return json({ error: 'bad key' });

  // 対象日（未指定なら今日）。日本時間で0:00〜23:59を見る。
  const base = p.date ? new Date(p.date + 'T00:00:00+09:00') : new Date();
  const from = new Date(base); from.setHours(0, 0, 0, 0);
  const to   = new Date(base); to.setHours(23, 59, 59, 999);

  const ids = p.cal ? String(p.cal).split(',') : TARGET_CALENDARS;
  const cals = ids.length
    ? ids.map(id => CalendarApp.getCalendarById(id.trim())).filter(Boolean)
    : CalendarApp.getAllOwnedCalendars();
  if (!cals.length) return json({ error: 'calendar not found', tried: ids });

  const events = [];
  cals.forEach(cal => {
    cal.getEvents(from, to).forEach(ev => {
      const allDay = ev.isAllDayEvent();
      events.push({
        title:  ev.getTitle(),
        allDay: allDay,
        start:  allDay ? null : hm(ev.getStartTime()),
        end:    allDay ? null : hm(ev.getEndTime()),
        cal:    cal.getName()
      });
    });
  });

  // 開始が早い順（終日は先頭）
  events.sort((a, b) => (a.start || '').localeCompare(b.start || ''));

  return json({ date: fmt(from), count: events.length, events: events });
}

function hm(d) {
  return Utilities.formatDate(d, 'Asia/Tokyo', 'HH:mm');
}
function fmt(d) {
  return Utilities.formatDate(d, 'Asia/Tokyo', 'yyyy-MM-dd');
}
function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
