<template>
  <footer class="text-gray-700 text-sm leading-normal flex flex-wrap justify-between mx-auto max-w-3xl px-6 sm:px-12">
    <div class="w-full sm:w-1/2 mb-4 sm:mb-0">
      <a href="https://www.linkedin.com/in/mhamri/">
        <img
          src="https://img.shields.io/badge/-mhamri-blue?style=flat-square&logo=Linkedin&logoColor=white&link=https://www.linkedin.com/in/mhamri/"
          alt="Mohammad Hossein Amri linkedin badge"
        />
      </a>
    </div>
    <div class="w-full sm:w-1/2">
      <nav>
        <ul class="flex sm:justify-end -mx-2">
          <li class="px-2">
            <g-link to="/" class="border-b border-transparent hover:border-gray-400 transition-colors duration-300">Home</g-link>
          </li>
          <!-- <li class="px-2">
            <g-link to="/about/" class="border-b border-transparent hover:border-gray-400 transition-colors duration-300">About</g-link>
          </li> -->
          <li class="px-2">
            <a href="/sitemap.xml" class="border-b border-transparent hover:border-gray-400 transition-colors duration-300">Sitemap</a>
          </li>
          <li class="px-2">
            <a href="/feed.xml" class="border-b border-transparent hover:border-gray-400 transition-colors duration-300">RSS Feed</a>
          </li>
        </ul>
      </nav>
    </div>
  </footer>
</template>

<script>
export default {
  name: 'Footer'
};
</script>
