import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { getEnvOrThrow } from '../../config';
import { Pinecone } from '../../vector_stores/pinecone';
import { SUPPORTED_VECTOR_STORES, type SupportedVectorStores } from '../../vector_stores';

const argv = yargs(hideBin(process.argv))
  .option('store', {
    choices: SUPPORTED_VECTOR_STORES,
    description: 'The vector store',
    demandOption: true,
  })
  .parseSync();

teardown(argv.store);

async function teardown(store: SupportedVectorStores) {
  switch (store) {
    case 'pinecone':
      return await Pinecone.teardown({
        apiKey: getEnvOrThrow('PINECONE_API_KEY'),
        environment: getEnvOrThrow('PINECONE_ENVIRONMENT'),
        index: getEnvOrThrow('PINECONE_INDEX'),
      });
    default:
      throw new Error(`Unrecognized store "${store}"`);
  }
}
