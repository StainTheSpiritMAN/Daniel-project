'use client';

import { MediaLibrary } from '../../_components/MediaLibrary';
import { PageTitle } from '../../_components/ui';

export default function MediaPage() {
  return (
    <>
      <PageTitle
        title="Media library"
        description="All photos, videos and documents. Images are automatically resized and compressed for fast loading. Files in use on the site cannot be deleted."
      />
      <MediaLibrary mode="manage" />
    </>
  );
}
