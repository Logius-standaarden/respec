export const name = "logius/title";

export async function run(conf) {
  if (!conf.isNoTrack) {
    document.title = `${document.title} ${conf.publishVersion}`;
    conf.title = `${conf.title} ${conf.publishVersion}`;
  }
}
